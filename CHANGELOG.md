# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- Phase 2: OpenAI Integration for automated Resume Review.
- Real-time notifications for application status updates.
- Export applications to CSV feature.

### Changed
- Improved dashboard loading performance by implementing data caching.
- Updated React dependencies to version 18.x.

### Fixed
- Issue with JWT token not refreshing gracefully on the client side.

## [1.0.0] - 2026-06-24

### Added
- **Initial Release** of PlacementOS.
- User Authentication (Register, Login, JWT session management).
- Resume Management (Upload, versioning, parsing).
- Job Application Tracking (Kanban board: Applied, Interviewing, Offered, Rejected).
- Coding Practice Monitoring (Integration with LeetCode API).
- Interactive Dashboard with basic statistics.
- RESTful API endpoints for core entities.
- MongoDB schema definitions and connection handlers.
- Comprehensive documentation (`README.md`, `CONTRIBUTING.md`, `SECURITY.md`).
- GitHub Actions for CI testing and linting.
