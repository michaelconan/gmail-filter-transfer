# gmail-filter-transfer
Apps Script solution to export user filters for import by another user, recreating labels as required

## Instructions
1. The first user runs `exportFilters` to prepare filter data and create JSON extract
2. The first user shares the filter export file (named with email and timestamp) with the second user
3. The second user enters the `FILEID` in the first line of the `importFilters` function, then runs `importFilters` 