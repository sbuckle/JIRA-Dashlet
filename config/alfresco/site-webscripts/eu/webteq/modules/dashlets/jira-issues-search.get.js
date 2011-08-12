/**
 * Fetches information about a particular issue from JIRA.
 * 
 * @method retrieveIssue
 * @param key The id of the issue
 * @return Object containing all the information about an issue
 */
function retrieveIssue(key)
{
	var uri, connector, result, issue=null;
	
	uri = "/issue/"+key;
	connector = remote.connect("jira");
	result = connector.get(uri);
	
	if (result.status == status.STATUS_OK)
	{
		issue = eval('(' + result.response + ')');
	}
	return issue;
}

/**
 * Builds a JQL string from the URL arguments
 * sent to the script.
 * 
 * @method buildQueryString
 * @return String representing query to send to JIRA
 */
function buildQueryString()
{
	var terms = [];

	var assignee = args.assignee || user.name; // default to the current user
	terms.push("assignee="+assignee);
	
	if (args.duedate && args.duedate.length > 0) {
		var dates = args.duedate.split(",");
		var i, len = dates.length;
		for (i = 0; i < len; i += 1) {
			terms.push("duedate"+dates[i]);
		}
		terms.push("duedate is not empty");
	}
	
	terms.push("resolution is empty"); // only retrieve unresolved issues for now
	
	var result = terms.join(" and ");
	if (args.sort) {
		var orderby = " order by " + args.sort;
		if (args.dir) {
			orderby += " " + args.dir;
		}
		result += orderby;
	}
	
	if (logger.isLoggingEnabled()) {
		logger.log("QUERY: "+result);
	}
	return result;
}

var uri, connector, result, issues=[],
	startAt = (args.startAt || 0),
	pageSize = (args.results || 50);

uri = "/search?jql=" + stringUtils.urlEncode( buildQueryString() );
connector = remote.connect("jira");
result = connector.get(uri);

if (result.status == 200)
{ 
	var id = eval('(' + result.response + ')');
	model.totalRecords = id.issues.length;
	model.recordOffset = startAt;
	// There appears to be a problem with the pagination in the sense that it doesn't appear to work!!
	// In the meantime, we do the pagination ourselves.
	var results = id.issues;
	results = results.slice(startAt, startAt + pageSize);
	// This is not ideal but we have to make a subsequent call to JIRA for each item
	// as no detailed information about each item is returned from the search results.
	results.map(function (item) {
		var issue = retrieveIssue(item.key);
		if (issue) {
			issues.push(issue);
		}
	});
	model.issues = issues;
}
else
{
	status.setCode(result.status, "Error during remote call. " +
             "Status: " + result.status + ", Response: " + result.response);
	status.redirect = true;
}