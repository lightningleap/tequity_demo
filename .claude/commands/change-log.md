Changelog Generation Requirements
Overview
Create an automated system to generate changelog files in markdown format after commits are pushed to the remote origin repository.
Directory Structure

Location: changelog/ folder at the project root
Purpose: Store all changelog files in a centralized location
Organization: Each changelog file represents commits since the last changelog was created

File Naming Convention

Format: YYYY-MM-DD-log.md
Example: 2025-09-25-log.md
Logic: Use the current date when the changelog is generated (after push to remote)

Trigger Mechanism

When: Execute changelog generation only after commits are successfully pushed to remote origin
Method: This could be implemented using:

Git post-push hooks
CI/CD pipeline automation
Manual execution after push confirmation
GitHub Actions or similar automation tools



Content Structure
Each changelog file should contain:
Header Information

Changelog title with generation date
Timestamp of when the file was created
Range of commits covered (from last changelog to current date)

Commit Details
For each commit since the last changelog, include:

Commit ID: Full hash or shortened version
Commit Date: When the commit was made
Author: Who made the commit
Commit Message: The commit description
Implementation Details: What was actually changed/implemented
Files Modified: List of files that were changed
Impact Summary: Brief description of what the changes accomplish

Additional Metadata

Total number of commits in this changelog
Summary of major changes or features
Any breaking changes or important notes

Date Range Logic

First Run: If no previous changelog exists, include all commits from project inception
Subsequent Runs: Include only commits made after the date of the most recent changelog file
Date Parsing: Extract the date from the most recent changelog filename to determine the starting point

Implementation Considerations

Ensure the script only runs after successful push to remote origin
Handle edge cases where no new commits exist since last changelog
Maintain consistent markdown formatting for readability
Include error handling for Git command failures
Consider file permissions and directory creation requirements

Integration Points

Hook into Git workflow after push operations
Integrate with existing CI/CD processes if applicable
Ensure compatibility with team development workflows
Consider automation through repository hosting platform features (GitHub Actions, GitLab CI, etc.)