#!/bin/bash

# 1. Print the table header
printf "\n%-25s | %-15s | %-15s | %-15s | %-15s\n" "Contributor" "Days Active" "Lines Added" "Lines Deleted" "Net Lines"
printf "%-25s-|-%-15s-|-%-15s-|-%-15s-|-%-15s\n" "-------------------------" "---------------" "---------------" "---------------" "---------------"

# 2. Get all unique authors and iterate through them
git log --format='%aN' | sort -u | while read -r author; do

    # Calculate unique days this author made a commit
    days_active=$(git log --author="$author" --date=short --format="%ad" | sort -u | wc -l)

    # Calculate lines added, removed, and net total
    stats=$(git log --author="$author" --pretty=tformat: --numstat | awk '
        {
            if ($1 ~ /^[0-9]+$/) add += $1;
            if ($2 ~ /^[0-9]+$/) subs += $2;
        }
        END {
            printf "%d %d %d", add, subs, add - subs
        }
    ')

    # Read the awk output into bash variables
    read -r added deleted net <<< "$stats"

    # Default to 0 if the variables are empty (e.g., if they only made empty merge commits)
    added=${added:-0}
    deleted=${deleted:-0}
    net=${net:-0}

    # 3. Print the formatted row for the author
    printf "%-25s | %-15s | %-15s | %-15s | %-15s\n" "$author" "$days_active" "$added" "$deleted" "$net"
done
echo ""
