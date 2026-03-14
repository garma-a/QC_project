#!/bin/bash

# =============================================================================
#  git_stats.sh — Full Contributor Report with Monthly Breakdown
# =============================================================================

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'
MAGENTA='\033[0;35m'; WHITE='\033[1;37m'

if ! git rev-parse --is-inside-work-tree &>/dev/null; then
    echo -e "${RED}ERROR: Not inside a git repository.${RESET}"; exit 1
fi

REPO_NAME=$(basename "$(git rev-parse --show-toplevel)")
TOTAL_COMMITS=$(git rev-list --count HEAD 2>/dev/null || echo 0)
FIRST_DATE=$(git log --reverse --format="%ad" --date=short | head -1)
LAST_DATE=$(git log --format="%ad" --date=short | head -1)

mapfile -t AUTHORS < <(git log --format='%aN' | sort -u)

# ── Portable date math ────────────────────────────────────────────────────────
to_epoch() {
    date -d "$1" +%s 2>/dev/null || date -j -f "%Y-%m-%d" "$1" +%s 2>/dev/null
}
add_one_month() {
    date -d "$1 +1 month" +%Y-%m-%d 2>/dev/null \
    || date -j -v+1m -f "%Y-%m-%d" "$1" +%Y-%m-%d 2>/dev/null
}
month_label() {
    date -d "$1" +"%B %Y" 2>/dev/null \
    || date -j -f "%Y-%m-%d" "$1" +"%B %Y" 2>/dev/null \
    || echo "$1"
}

# ── Formatted NET with fixed width (color-safe) ───────────────────────────────
fmt_net() {
    local net=$1 w=${2:-11}
    local sign=""
    [ "$net" -gt 0 ] && sign="+"
    local raw="${sign}${net}"
    local pad=$(( w - ${#raw} ))
    local spaces; spaces=$(printf '%*s' "$pad" '')
    if   [ "$net" -gt 0 ]; then printf "${GREEN}%s%s${RESET}" "$spaces" "$raw"
    elif [ "$net" -lt 0 ]; then printf "${RED}%s%s${RESET}"   "$spaces" "$raw"
    else                        printf "${WHITE}%s%s${RESET}"  "$spaces" "$raw"
    fi
}

# ── Streak label ──────────────────────────────────────────────────────────────
fmt_streak() {
    local s=$1
    if   [ "$s" -ge 7 ]; then printf "${YELLOW}%s days 🔥${RESET}" "$s"
    elif [ "$s" -ge 3 ]; then printf "${GREEN}%s days${RESET}"     "$s"
    else                      printf "${WHITE}%s days${RESET}"     "$s"
    fi
}

# ── Calc max consecutive-day streak (optional since/until as YYYY-MM-DD) ──────
calc_streak() {
    local author="$1" since="$2" until="$3"
    local -a flags=( --author="$author" --date=short --format="%ad" )
    [ -n "$since" ] && flags+=( "--after=${since}" )
    [ -n "$until" ] && flags+=( "--before=${until}" )

    local max=0 cur=0 prev=""
    while IFS= read -r d; do
        if [ -z "$prev" ]; then
            cur=1
        else
            local pe ce dd
            pe=$(to_epoch "$prev"); ce=$(to_epoch "$d")
            if [ -n "$pe" ] && [ -n "$ce" ]; then
                dd=$(( (ce - pe) / 86400 ))
                [ "$dd" -eq 1 ] && cur=$(( cur+1 )) || cur=1
            fi
        fi
        [ "$cur" -gt "$max" ] && max=$cur
        prev="$d"
    done < <(git log "${flags[@]}" | sort -u)
    echo "$max"
}

# ── Stats for an author (optional since/until) ────────────────────────────────
author_stats() {
    # outputs: commits days added deleted net
    local author="$1" since="$2" until="$3"
    local -a flags=( --author="$author" )
    [ -n "$since" ] && flags+=( "--after=${since}" )
    [ -n "$until" ] && flags+=( "--before=${until}" )

    local c d
    c=$(git rev-list --count "${flags[@]}" HEAD 2>/dev/null || echo 0)
    d=$(git log "${flags[@]}" --date=short --format="%ad" | sort -u | wc -l | tr -d ' ')

    local st
    st=$(git log "${flags[@]}" --pretty=tformat: --numstat -- . ':(exclude)package-lock.json' ':(exclude)bun.lock' | awk \
        '{ if($1~/^[0-9]+$/) a+=$1; if($2~/^[0-9]+$/) s+=$2 } END{ printf "%d %d %d",a,s,a-s }')
    local added deleted net
    read -r added deleted net <<< "$st"
    echo "${c} ${d} ${added:-0} ${deleted:-0} ${net:-0}"
}

# ── Table header ──────────────────────────────────────────────────────────────
print_header() {
    local prefix="$1"
    printf "${BOLD}${WHITE}"
    printf "%s%-22s | %7s | %6s | %11s | %10s | %11s | %10s${RESET}\n" \
        "$prefix" "CONTRIBUTOR" "COMMITS" "DAYS" "LINES +" "LINES -" "NET" "MAX STREAK"
    printf "%s%-22s-+-%7s-+-%6s-+-%11s-+-%10s-+-%11s-+-%10s\n" \
        "$prefix" "----------------------" "-------" "------" "-----------" "----------" "-----------" "----------"
}

# ── Print one author row ──────────────────────────────────────────────────────
print_row() {
    local prefix="$1" author="$2" c="$3" d="$4" added="$5" deleted="$6" net="$7" streak="$8"
    printf "%s%-22s | %7s | %6s | %11s | %10s | " \
        "$prefix" "$author" "$c" "$d" "$added" "$deleted"
    fmt_net "$net" 11
    printf " | "
    fmt_streak "$streak"
    printf "\n"
}

# =============================================================================
#  SECTION 1 — OVERALL SUMMARY
# =============================================================================
echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════════════════════╗${RESET}"
printf "${BOLD}${CYAN}║         GIT CONTRIBUTOR REPORT  —  ${WHITE}%-16s${CYAN}                          ║${RESET}\n" "$REPO_NAME"
echo -e "${BOLD}${CYAN}╠══════════════════════════════════════════════════════════════════════════════╣${RESET}"
printf "${CYAN}║${RESET}  Project Period : ${YELLOW}%-12s${RESET}  →  ${YELLOW}%-12s${RESET}                                  ${CYAN}║${RESET}\n" "$FIRST_DATE" "$LAST_DATE"
printf "${CYAN}║${RESET}  Total Commits  : ${GREEN}%-6s${RESET}                                                          ${CYAN}║${RESET}\n" "$TOTAL_COMMITS"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════════════════════╝${RESET}"

echo ""
echo -e "${BOLD}${WHITE}  ★  OVERALL TOTALS  (full project lifetime)${RESET}"
echo ""
print_header "  "

for author in "${AUTHORS[@]}"; do
    read -r c d added deleted net <<< "$(author_stats "$author")"
    streak=$(calc_streak "$author")
    print_row "  " "$author" "$c" "$d" "$added" "$deleted" "$net" "$streak"
done


# =============================================================================
#  TOP 3 CONTRIBUTORS PODIUM
#  Score = (lines touched ÷ 80) + (active days × 3) + (commits × 2)
#  "Lines touched" = added + deleted  (can't be faked with empty commits)
#  Commits are intentionally excluded — they are trivial to spam
# =============================================================================
echo ""
echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}${WHITE}  ★  TOP 3 CONTRIBUTORS${RESET}"
echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════════════════════════════════${RESET}"
echo ""

declare -a SCORED=()
for author in "${AUTHORS[@]}"; do
    read -r c d added deleted net <<< "$(author_stats "$author")"
    touched=$(( added + deleted ))
    score=$(( touched / 80 + d * 3 + c * 2 ))
    SCORED+=( "${score}|${author}" )
done

mapfile -t SORTED < <(printf '%s\n' "${SCORED[@]}" | sort -t'|' -k1 -rn)

MEDALS=( "🥇" "🥈" "🥉" )
MEDAL_LABELS=( "1st  —  GOLD" "2nd  —  SILVER" "3rd  —  BRONZE" )
MEDAL_COLORS=( "${YELLOW}" "${WHITE}" "\033[0;33m" )

for i in 0 1 2; do
    [ "${i}" -ge "${#SORTED[@]}" ] && break
    entry="${SORTED[$i]}"
    score="${entry%%|*}"
    author="${entry#*|}"
    read -r c d added deleted net <<< "$(author_stats "$author")"
    touched=$(( added + deleted ))
    streak=$(calc_streak "$author")

    echo -e "${BOLD}${MEDAL_COLORS[$i]}  ${MEDALS[$i]}  ${MEDAL_LABELS[$i]}  —  ${author}${RESET}"
    printf "      Commits : ${GREEN}%s${RESET}\n" "$c"
    printf "      Days    : ${GREEN}%s${RESET}\n" "$d"
    printf "      Net     : "; fmt_net "$net" 1; printf "\n"
    printf "      Streak  : "; fmt_streak "$streak"; printf "\n"
    lines_pts=$(( touched / 80 ))
    days_pts=$(( d * 3 ))
    commits_pts=$(( c * 2 ))
    printf "      Score   : ${CYAN}%s pts${RESET}  ( lines %s÷80=%s  +  days %s×3=%s  +  commits %s×2=%s )
" \
        "$score" "$touched" "$lines_pts" "$d" "$days_pts" "$c" "$commits_pts"
    echo ""
done

# =============================================================================
#  SECTION 2 — MONTHLY BREAKDOWN
# =============================================================================
echo ""
echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}${WHITE}  ★  MONTHLY BREAKDOWN${RESET}"
echo -e "${BOLD}${CYAN}════════════════════════════════════════════════════════════════════════════════${RESET}"

mapfile -t ALL_MONTHS < <(git log --format="%ad" --date=format:"%Y-%m" | sort -u)

for ym in "${ALL_MONTHS[@]}"; do
    YEAR="${ym%-*}"; MONTH="${ym#*-}"
    SINCE="${YEAR}-${MONTH}-01"
    UNTIL=$(add_one_month "$SINCE")

    # Last day for display only
    LAST_DAY=$(date -d "${UNTIL} -1 day" +%Y-%m-%d 2>/dev/null \
            || date -j -v-1d -f "%Y-%m-%d" "${UNTIL}" +%Y-%m-%d 2>/dev/null \
            || echo "$UNTIL")
    MLABEL=$(month_label "$SINCE")

    echo ""
    echo -e "${BOLD}${MAGENTA}  ┌─ ${MLABEL}  [ ${SINCE} → ${LAST_DAY} ]${RESET}"
    print_header "  │  "

    any=0
    for author in "${AUTHORS[@]}"; do
        read -r c d added deleted net <<< "$(author_stats "$author" "$SINCE" "$UNTIL")"
        [ "$c" -eq 0 ] && continue
        any=1
        streak=$(calc_streak "$author" "$SINCE" "$UNTIL")
        print_row "  │  " "$author" "$c" "$d" "$added" "$deleted" "$net" "$streak"
    done

    [ "$any" -eq 0 ] && echo -e "  │  ${YELLOW}(no commits this month)${RESET}"
    echo -e "  ${MAGENTA}└$(printf '─%.0s' {1..78})${RESET}"
done

echo ""
echo -e "${BOLD}${CYAN}── NOTES ──────────────────────────────────────────────────────────────────────${RESET}"
echo -e "  ${YELLOW}STREAK${RESET} : Longest run of consecutive days with at least one commit."
echo -e "  ${YELLOW}🔥${RESET}     : 7 or more consecutive days."
echo -e "  ${GREEN}NET +${RESET}  : More lines added than deleted."
echo -e "  ${RED}NET -${RESET}  : More lines deleted than added."
echo ""
