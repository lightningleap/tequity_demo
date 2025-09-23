#!/bin/bash
# Log tool usage with timestamps for debugging and tracking
# Creates .claude/logs/tool-usage.log

# Create logs directory if it doesn't exist
mkdir -p "$(dirname "$0")/../logs"

# Log file path
LOG_FILE="$(dirname "$0")/../logs/tool-usage.log"

# Get current timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Log the tool usage (arguments passed from Claude)
echo "[$TIMESTAMP] Tool executed: $@" >> "$LOG_FILE"

# Optional: Keep only last 1000 lines to prevent log file from growing too large
if [ -f "$LOG_FILE" ]; then
    tail -n 1000 "$LOG_FILE" > "$LOG_FILE.tmp" && mv "$LOG_FILE.tmp" "$LOG_FILE"
fi