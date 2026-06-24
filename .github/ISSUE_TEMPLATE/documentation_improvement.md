name: Documentation Improvement
description: Suggest improvements or report errors in the documentation
title: "[DOCS] "
labels: ["documentation", "triage"]
assignees: []

body:
  - type: markdown
    attributes:
      value: |
        Thanks for helping us improve our documentation! 
  - type: input
    id: location
    attributes:
      label: Documentation Location
      description: Which file or section needs improvement?
      placeholder: "e.g., README.md - Installation Section, or swagger API docs"
    validations:
      required: true
  - type: textarea
    id: current_state
    attributes:
      label: Current State
      description: What is currently wrong or missing?
    validations:
      required: true
  - type: textarea
    id: proposed_changes
    attributes:
      label: Proposed Changes
      description: What should the documentation say instead?
    validations:
      required: true
