/**
 * Function to export Gmail filters using the advanced service, map label IDs
 * to display names for replication in another user's inbox, and export to JSON
 */
function exportFilters() {
  
  // Get labels and filters for user
  let labels = Gmail.Users.Labels.list('me').labels;
  let labelMap = Object.fromEntries(labels.map(l => [l.id, l.name]));
  let filters = Gmail.Users.Settings.Filters.list('me').filter;

  // Create export of filters for import by another user
  filters = {
    filters: filters.map(f => {
      let newFilter = {
        criteria: f.criteria
      };
      // Map Label IDs to names to recreate for new user
      Object.entries(f.action).forEach(([k,v]) => {
        if (k.endsWith('Ids')) {
          newFilter[k] = v.map(l => labelMap[l])
        } else {
          newFilter[k] = v;
        }
      });
      return newFilter;
    })
  };
  
  // Export as JSON to drive file
  let fileName = Session.getEffectiveUser().getEmail() + '_filters_' + new Date().toISOString() + '.json';
  let exportFile = DriveApp.createFile(Utilities.newBlob(JSON.stringify(filters, null, 2)).setName(fileName));
  console.log(exportFile.getUrl());
}

/**
 * Function to import the JSON export from another user's filters, create required labels,
 * and add filters
 */
function importFilters() {
  
  // Load and read export file
  let filterFile = DriveApp.getFileById('FILEID');
  let filterData = JSON.parse(filterFile.getBlob().getDataAsString()).filters;

  // Get current filters
  let labels = Gmail.Users.Labels.list('me').labels;
  let labelNames = labels.map(l => l.name);

  // Get unique list of labels from filter imports
  let newLabels = filterData.map(f => {
    let labels = [];
    if (f.action.addLabelIds) {
      labels.push(...f.action.addLabelIds);
    }
    if (f.action.removeLabelIds) {
      labels.push(...f.action.removeLabelIds);
    }
  }).filter((e,i,arr) => arr.indexOf(e) === i);

  // Create any missing labels
  let labelMap = {};
  for (let label of newLabels) {
    if (!labelNames.includes(label)) {
      let newLabel = Gmail.Users.Labels.create({
        name: label
      }, 'me');
      labelMap[label] = newLabel.id;
    }
  }

  // Apply label IDs to filters for creation
  filterData = filterData.map(f => {
    if (f.action.addLabelIds) {
      f.action.addLabelIds = f.action.addLabelIds.map(l => labelMap[l]);
    }
    if (f.action.removeLabelIds) {
      f.action.removeLabelIds = f.action.removeLabelIds.map(l => labelMap[l]);
    }
    return f;
  });

  // Create all filters
  for (let filter of filterData) {
    Gmail.Users.Settings.Filters.create(filter, 'me');
  }

}