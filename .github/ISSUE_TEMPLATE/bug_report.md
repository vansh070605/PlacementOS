name: Bug Report
description: Create a report to help us improve
title: "[BUG] "
labels: ["bug", "triage"]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Thanks for taking the time to fill out this bug report! Please ensure you have searched existing issues before submitting.
  - type: input
    id: version
    attributes:
      label: PlacementOS Version
      description: Which version of PlacementOS are you using?
      placeholder: e.g., 1.0.0 or main branch
    validations:
      required: true
  - type: textarea
    id: description
    attributes:
      label: Describe the bug
      description: A clear and concise description of what the bug is.
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Steps to Reproduce
      description: Steps to reproduce the behavior.
      placeholder: |
        1. Go to '...'
        2. Click on '....'
        3. Scroll down to '....'
        4. See error
    validations:
      required: true
  - type: textarea
    id: expected
    attributes:
      label: Expected behavior
      description: A clear and concise description of what you expected to happen.
    validations:
      required: true
  - type: textarea
    id: screenshots
    attributes:
      label: Screenshots / Logs
      description: If applicable, add screenshots or console logs to help explain your problem.
  - type: input
    id: environment
    attributes:
      label: Environment
      description: Node.js version, Browser, OS, etc.
      placeholder: "Node v18, Chrome 114, Windows 11"
    validations:
      required: true
