function getConfigProperty(prop, val)
{
	// optional - default return value if config property does not exist
	val = val || null; 
	
	var scriptConfig = new XML(config.script),
		item = scriptConfig[prop];
	if (item) {
		item = item.toString();
	}
	return item && item.length > 0 ? item : val;
}

var scriptConfig = new XML(config.script), filters = [];

for each(var filter in scriptConfig..filter) {
	filters.push({
		label: filter.@label.toString(),
		value: filter.@value.toString()
	});
}
model.filters = filters;

model.pageSize = (args.pageSize) ? args.pageSize : getConfigProperty("pageSize");
model.jiraUrl = getConfigProperty("jiraUrl");
model.jiraUser = (args.jiraUser) ? args.jiraUser : getConfigProperty("jiraUser", user.name);

var columns = (args.columns) ? args.columns : getConfigProperty("columns");
model.columns = columns.split(",");