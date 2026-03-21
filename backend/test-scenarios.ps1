param(
  [string]$BaseUrl = "http://localhost:5000/api"
)

$ErrorActionPreference = "Stop"

function Test-Case {
  param(
    [string]$Name,
    [scriptblock]$Body
  )

  Write-Host "`n=== $Name ===" -ForegroundColor Cyan
  try {
    & $Body
    Write-Host "PASS" -ForegroundColor Green
  } catch {
    Write-Host "FAIL: $($_.Exception.Message)" -ForegroundColor Red
  }
}

function Invoke-Api {
  param(
    [string]$Method,
    [string]$Path,
    $Payload
  )

  $url = "$BaseUrl$Path"
  if ($null -eq $Payload) {
    return Invoke-RestMethod -Method $Method -Uri $url -ContentType "application/json"
  }

  $json = $Payload | ConvertTo-Json -Depth 15
  return Invoke-RestMethod -Method $Method -Uri $url -ContentType "application/json" -Body $json
}

function As-ApiArray {
  param($Value)

  if ($null -eq $Value) {
    return @()
  }

  # Some PowerShell JSON shapes come back as @{ value = [...]; Count = n }
  if ($Value.PSObject -and $Value.PSObject.Properties.Name -contains 'value') {
    return @($Value.value)
  }

  # Force scalar/object responses into array form for consistent payload shape
  return @($Value)
}

Write-Host "Running ChronoMaria API test scenarios against $BaseUrl" -ForegroundColor Yellow

# 1) Health / data source sanity
Test-Case -Name "Scenario 1: Source data endpoints have records" -Body {
  $faculty = As-ApiArray (Invoke-Api -Method GET -Path "/faculty" -Payload $null)
  $subjects = As-ApiArray (Invoke-Api -Method GET -Path "/subjects" -Payload $null)
  $rooms = As-ApiArray (Invoke-Api -Method GET -Path "/rooms" -Payload $null)

  if (($faculty | Measure-Object).Count -le 0) { throw "Faculty is empty" }
  if (($subjects | Measure-Object).Count -le 0) { throw "Subjects is empty" }
  if (($rooms | Measure-Object).Count -le 0) { throw "Rooms is empty" }

  Write-Host "faculty=$($faculty.Count) subjects=$($subjects.Count) rooms=$($rooms.Count)"
}

# 2) Generate with normal payload
Test-Case -Name "Scenario 2: Generate schedule success" -Body {
  $faculty = As-ApiArray (Invoke-Api -Method GET -Path "/faculty" -Payload $null)
  $subjects = As-ApiArray (Invoke-Api -Method GET -Path "/subjects" -Payload $null)
  $rooms = As-ApiArray (Invoke-Api -Method GET -Path "/rooms" -Payload $null)

  $payload = @{
    faculty = $faculty
    subjects = $subjects
    rooms = $rooms
    constraints = @{
      max_generations = 50
      population_size = 30
      mutation_rate = 0.1
      max_runtime_seconds = 6
    }
  }

  $resp = Invoke-Api -Method POST -Path "/schedule/generate" -Payload $payload

  if (-not $resp.success) { throw "Expected success=true" }
  if (-not $resp.schedule) { throw "Missing schedule" }
  if ($null -eq $resp.fitness) { throw "Missing fitness" }
  if ($null -eq $resp.generations) { throw "Missing generations" }
  if ($null -eq $resp.report) { throw "Missing report" }

  Write-Host "scheduleCount=$($resp.schedule.Count) fitness=$($resp.fitness) generations=$($resp.generations)"
}

# 3) Generate with out-of-range constraints should clamp safely
Test-Case -Name "Scenario 3: Constraint clamping behavior" -Body {
  $faculty = As-ApiArray (Invoke-Api -Method GET -Path "/faculty" -Payload $null)
  $subjects = As-ApiArray (Invoke-Api -Method GET -Path "/subjects" -Payload $null)
  $rooms = As-ApiArray (Invoke-Api -Method GET -Path "/rooms" -Payload $null)

  $payload = @{
    faculty = $faculty
    subjects = $subjects
    rooms = $rooms
    constraints = @{
      max_generations = -99
      population_size = 999
      mutation_rate = 9
      max_runtime_seconds = 0
    }
  }

  $resp = Invoke-Api -Method POST -Path "/schedule/generate" -Payload $payload

  if ($resp.constraints.max_generations -ne 10) { throw "max_generations expected 10, got $($resp.constraints.max_generations)" }
  if ($resp.constraints.population_size -ne 80) { throw "population_size expected 80, got $($resp.constraints.population_size)" }
  if ($resp.constraints.mutation_rate -ne 0.5) { throw "mutation_rate expected 0.5, got $($resp.constraints.mutation_rate)" }
  if ($resp.constraints.max_runtime_seconds -ne 5) { throw "max_runtime_seconds expected 5, got $($resp.constraints.max_runtime_seconds)" }
}

# 4) Invalid payload type should return 400
Test-Case -Name "Scenario 4: Generate rejects bad payload" -Body {
  $badPayload = @{ faculty = "bad"; subjects = @(); rooms = @() }

  try {
    $null = Invoke-Api -Method POST -Path "/schedule/generate" -Payload $badPayload
    throw "Expected 400 but request succeeded"
  } catch {
    if ($_.Exception.Response.StatusCode.Value__ -ne 400) {
      throw "Expected HTTP 400, got $($_.Exception.Response.StatusCode.Value__)"
    }
  }
}

# 5) Validate detects faculty and room conflicts
Test-Case -Name "Scenario 5: Validate conflict detection" -Body {
  $payload = @{
    schedule = @(
      @{ subject = "A"; faculty_id = 1; room_id = 1; day = "Monday"; time = "7:00-8:00" },
      @{ subject = "B"; faculty_id = 1; room_id = 2; day = "Monday"; time = "7:00-8:00" },
      @{ subject = "C"; faculty_id = 2; room_id = 2; day = "Monday"; time = "7:00-8:00" }
    )
  }

  $resp = Invoke-Api -Method POST -Path "/schedule/validate" -Payload $payload

  if ($resp.valid -ne $false) { throw "Expected valid=false" }
  if ($resp.conflictCount -lt 2) { throw "Expected at least 2 conflicts, got $($resp.conflictCount)" }

  $types = @($resp.conflicts | ForEach-Object { $_.type })
  if ($types -notcontains "faculty_conflict") { throw "Missing faculty_conflict" }
  if ($types -notcontains "room_conflict") { throw "Missing room_conflict" }
}

# 6) Stateless contract: removed endpoints should 404
Test-Case -Name "Scenario 6: Stateless endpoint contract" -Body {
  foreach ($path in @('/schedule/count', '/schedule/master')) {
    try {
      $null = Invoke-Api -Method GET -Path $path -Payload $null
      throw "Expected 404 for $path"
    } catch {
      if ($_.Exception.Response.StatusCode.Value__ -ne 404) {
        throw "Expected HTTP 404 for $path, got $($_.Exception.Response.StatusCode.Value__)"
      }
    }
  }
}

# 7) Room eligibility rules in generation
Test-Case -Name "Scenario 7: Room eligibility (status/department/type/common-room)" -Body {
  $faculty = @(
    @{
      id = 1001
      name = "Faculty A"
      department = "Computer Science"
      max_units = 21
      preferred_subjects = ""
    }
  )

  $subjects = @(
    @{
      id = 2001
      name = "Programming Lab"
      department = "Computer Science"
      units = 3
      subject_type = "Computer Lab"
      code = "CSLAB-1"
    }
  )

  $rooms = @(
    @{
      id = 3001
      room_code = "UNAV-1"
      status = "Unavailable"
      common_room = $false
      room_department = "Computer Science"
      subject_type = "Computer Lab"
      room_type = "Laboratory"
      capacity = 40
    },
    @{
      id = 3002
      room_code = "MISMATCH-1"
      status = "Available"
      common_room = $false
      room_department = "Engineering"
      subject_type = "Biology Lab"
      room_type = "Laboratory"
      capacity = 40
    },
    @{
      id = 3003
      room_code = "CSLAB-OK"
      status = "Available"
      common_room = $false
      room_department = "Computer Science"
      subject_type = "Computer Lab"
      room_type = "Computer Lab"
      capacity = 40
    }
  )

  $payload = @{
    faculty = $faculty
    subjects = $subjects
    rooms = $rooms
    constraints = @{
      max_generations = 20
      population_size = 12
      mutation_rate = 0.1
      max_runtime_seconds = 5
    }
  }

  $resp = Invoke-Api -Method POST -Path "/schedule/generate" -Payload $payload

  if (-not $resp.success) { throw "Expected success=true" }
  if (-not $resp.schedule -or $resp.schedule.Count -ne 1) { throw "Expected exactly one scheduled class" }

  $assignedRoom = $resp.schedule[0].room
  if ($assignedRoom -ne "CSLAB-OK") {
    throw "Expected eligible room CSLAB-OK, got $assignedRoom"
  }

  $conflicts = $resp.report.conflicts
  $statusCount = if ($conflicts -and $conflicts.PSObject.Properties.Name -contains 'room_status_issue_count') {
    [int]$conflicts.room_status_issue_count
  } elseif ($conflicts) {
    @($conflicts.room_status_issues).Count
  } else {
    0
  }

  $deptCount = if ($conflicts -and $conflicts.PSObject.Properties.Name -contains 'room_department_mismatch_count') {
    [int]$conflicts.room_department_mismatch_count
  } elseif ($conflicts) {
    @($conflicts.room_department_mismatches).Count
  } else {
    0
  }

  $typeCount = if ($conflicts -and $conflicts.PSObject.Properties.Name -contains 'room_type_mismatch_count') {
    [int]$conflicts.room_type_mismatch_count
  } elseif ($conflicts) {
    @($conflicts.room_type_mismatches).Count
  } else {
    0
  }

  if ($statusCount -ne 0) { throw "Expected room status issues=0, got $statusCount" }
  if ($deptCount -ne 0) { throw "Expected room department mismatches=0, got $deptCount" }
  if ($typeCount -ne 0) { throw "Expected room type mismatches=0, got $typeCount" }
}

# 8) Common room allows cross-department usage
Test-Case -Name "Scenario 8: Common room cross-department behavior" -Body {
  $faculty = @(
    @{
      id = 1101
      name = "Faculty B"
      department = "Computer Science"
      max_units = 21
      preferred_subjects = ""
    }
  )

  $subjects = @(
    @{
      id = 2101
      name = "Systems Lab"
      department = "Computer Science"
      units = 3
      subject_type = "Computer Lab"
      code = "CSLAB-2"
    }
  )

  $rooms = @(
    @{
      id = 3101
      room_code = "ENG-NONCOMMON"
      status = "Available"
      common_room = $false
      room_department = "Engineering"
      subject_type = "Computer Lab"
      room_type = "Computer Lab"
      capacity = 40
    },
    @{
      id = 3102
      room_code = "ENG-COMMON"
      status = "Available"
      common_room = $true
      room_department = "Engineering"
      subject_type = "Computer Lab"
      room_type = "Computer Lab"
      capacity = 40
    }
  )

  $payload = @{
    faculty = $faculty
    subjects = $subjects
    rooms = $rooms
    constraints = @{
      max_generations = 20
      population_size = 12
      mutation_rate = 0.1
      max_runtime_seconds = 5
    }
  }

  $resp = Invoke-Api -Method POST -Path "/schedule/generate" -Payload $payload

  if (-not $resp.success) { throw "Expected success=true" }
  if (-not $resp.schedule -or $resp.schedule.Count -ne 1) { throw "Expected exactly one scheduled class" }

  $assignedRoom = $resp.schedule[0].room
  if ($assignedRoom -ne "ENG-COMMON") {
    throw "Expected common room ENG-COMMON, got $assignedRoom"
  }

  $conflicts = $resp.report.conflicts
  $deptCount = if ($conflicts -and $conflicts.PSObject.Properties.Name -contains 'room_department_mismatch_count') {
    [int]$conflicts.room_department_mismatch_count
  } elseif ($conflicts) {
    @($conflicts.room_department_mismatches).Count
  } else {
    0
  }

  if ($deptCount -ne 0) { throw "Expected room department mismatches=0, got $deptCount" }
}

# 9) Legacy room_number fallback remains supported
Test-Case -Name "Scenario 9: Legacy room_number fallback" -Body {
  $faculty = @(
    @{ id = 1201; name = "Faculty C"; department = "Computer Science"; max_units = 21; preferred_subjects = "" }
  )

  $subjects = @(
    @{ id = 2201; name = "Network Lab"; department = "Computer Science"; units = 3; subject_type = "Computer Lab" }
  )

  $rooms = @(
    @{ id = 3201; room_number = "LEGACY-101"; status = "Available"; common_room = $true; subject_type = "Computer Lab"; room_type = "Computer Lab"; capacity = 40 }
  )

  $payload = @{
    faculty = $faculty
    subjects = $subjects
    rooms = $rooms
    constraints = @{ max_generations = 15; population_size = 10; mutation_rate = 0.1; max_runtime_seconds = 5 }
  }

  $resp = Invoke-Api -Method POST -Path "/schedule/generate" -Payload $payload
  if (-not $resp.success) { throw "Expected success=true" }
  if ($resp.schedule.Count -ne 1) { throw "Expected schedule count 1" }
  if ($resp.schedule[0].room -ne "LEGACY-101") { throw "Expected room LEGACY-101, got $($resp.schedule[0].room)" }
}

# 10) Subject type inference from subject name containing "Lab"
Test-Case -Name "Scenario 10: Subject type inference from Lab name" -Body {
  $faculty = @(
    @{ id = 1301; name = "Faculty D"; department = "Computer Science"; max_units = 21; preferred_subjects = "" }
  )

  $subjects = @(
    @{ id = 2301; name = "Operating Systems Lab"; department = "Computer Science"; units = 3 }
  )

  $rooms = @(
    @{ id = 3301; room_code = "LECT-ONLY"; status = "Available"; common_room = $false; room_department = "Computer Science"; room_type = "Lecture Room"; subject_type = "Lecture Room"; capacity = 40 },
    @{ id = 3302; room_code = "LAB-ONLY"; status = "Available"; common_room = $false; room_department = "Computer Science"; room_type = "Computer Lab"; subject_type = "Computer Lab"; capacity = 40 }
  )

  $payload = @{
    faculty = $faculty
    subjects = $subjects
    rooms = $rooms
    constraints = @{ max_generations = 15; population_size = 10; mutation_rate = 0.1; max_runtime_seconds = 5 }
  }

  $resp = Invoke-Api -Method POST -Path "/schedule/generate" -Payload $payload
  if (-not $resp.success) { throw "Expected success=true" }
  if ($resp.schedule.Count -ne 1) { throw "Expected schedule count 1" }
  if ($resp.schedule[0].room -ne "LAB-ONLY") { throw "Expected room LAB-ONLY, got $($resp.schedule[0].room)" }
}

# 11) Degraded mode: all rooms unavailable still returns schedule but reports status issues
Test-Case -Name "Scenario 11: Degraded fallback when all rooms unavailable" -Body {
  $faculty = @(
    @{ id = 1401; name = "Faculty E"; department = "Computer Science"; max_units = 21; preferred_subjects = "" }
  )

  $subjects = @(
    @{ id = 2401; name = "Data Structures"; department = "Computer Science"; units = 3; subject_type = "Lecture Room" }
  )

  $rooms = @(
    @{ id = 3401; room_code = "UNAV-A"; status = "Unavailable"; common_room = $true; room_type = "Lecture Room"; subject_type = "Lecture Room"; capacity = 40 },
    @{ id = 3402; room_code = "UNAV-B"; status = "Unavailable"; common_room = $true; room_type = "Lecture Room"; subject_type = "Lecture Room"; capacity = 40 }
  )

  $payload = @{
    faculty = $faculty
    subjects = $subjects
    rooms = $rooms
    constraints = @{ max_generations = 15; population_size = 10; mutation_rate = 0.1; max_runtime_seconds = 5 }
  }

  $resp = Invoke-Api -Method POST -Path "/schedule/generate" -Payload $payload
  if (-not $resp.success) { throw "Expected success=true" }
  if ($resp.schedule.Count -ne 1) { throw "Expected schedule count 1" }

  $conflicts = $resp.report.conflicts
  $statusCount = if ($conflicts -and $conflicts.PSObject.Properties.Name -contains 'room_status_issue_count') {
    [int]$conflicts.room_status_issue_count
  } elseif ($conflicts) {
    @($conflicts.room_status_issues).Count
  } else {
    0
  }

  if ($statusCount -lt 1) { throw "Expected at least 1 room status issue in degraded mode, got $statusCount" }
}

# 12) Validate rejects non-array payload
Test-Case -Name "Scenario 12: Validate rejects non-array schedule" -Body {
  $badPayload = @{ schedule = "bad" }
  try {
    $null = Invoke-Api -Method POST -Path "/schedule/validate" -Payload $badPayload
    throw "Expected 400 but request succeeded"
  } catch {
    if ($_.Exception.Response.StatusCode.Value__ -ne 400) {
      throw "Expected HTTP 400, got $($_.Exception.Response.StatusCode.Value__)"
    }
  }
}

# 13) Validate identifies missing day/time entries
Test-Case -Name "Scenario 13: Validate flags invalid timeslot entries" -Body {
  $payload = @{
    schedule = @(
      @{ subject = "A"; faculty_id = 1; room_id = 1; day = ""; time = "7:00-8:00" },
      @{ subject = "B"; faculty_id = 2; room_id = 2; day = "Monday"; time = "" }
    )
  }

  $resp = Invoke-Api -Method POST -Path "/schedule/validate" -Payload $payload
  if ($resp.valid -ne $false) { throw "Expected valid=false" }
  if ($resp.conflictCount -lt 2) { throw "Expected at least 2 conflicts, got $($resp.conflictCount)" }
  $types = @($resp.conflicts | ForEach-Object { $_.type })
  if ($types -notcontains "invalid_timeslot") { throw "Expected invalid_timeslot conflict type" }
}

# 14) Generate rejects empty arrays
Test-Case -Name "Scenario 14: Generate rejects empty arrays" -Body {
  $badPayload = @{ faculty = @(); subjects = @(); rooms = @() }
  try {
    $null = Invoke-Api -Method POST -Path "/schedule/generate" -Payload $badPayload
    throw "Expected 400 but request succeeded"
  } catch {
    if ($_.Exception.Response.StatusCode.Value__ -ne 400) {
      throw "Expected HTTP 400, got $($_.Exception.Response.StatusCode.Value__)"
    }
  }
}

# 15) Omitted constraints should use defaults
Test-Case -Name "Scenario 15: Generate default constraints" -Body {
  $faculty = As-ApiArray (Invoke-Api -Method GET -Path "/faculty" -Payload $null)
  $subjects = As-ApiArray (Invoke-Api -Method GET -Path "/subjects" -Payload $null)
  $rooms = As-ApiArray (Invoke-Api -Method GET -Path "/rooms" -Payload $null)

  $payload = @{
    faculty = $faculty
    subjects = $subjects
    rooms = $rooms
  }

  $resp = Invoke-Api -Method POST -Path "/schedule/generate" -Payload $payload
  if (-not $resp.success) { throw "Expected success=true" }
  if ($resp.constraints.max_generations -ne 300) { throw "Expected default max_generations=300, got $($resp.constraints.max_generations)" }
  if ($resp.constraints.population_size -ne 60) { throw "Expected default population_size=60, got $($resp.constraints.population_size)" }
  if ($resp.constraints.mutation_rate -ne 0.1) { throw "Expected default mutation_rate=0.1, got $($resp.constraints.mutation_rate)" }
  if ($resp.constraints.max_runtime_seconds -ne 20) { throw "Expected default max_runtime_seconds=20, got $($resp.constraints.max_runtime_seconds)" }
}

Write-Host "`nAll test scenarios executed." -ForegroundColor Yellow
