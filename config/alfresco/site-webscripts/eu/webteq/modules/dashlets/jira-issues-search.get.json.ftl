<#escape x as jsonUtils.encodeJSONString(x)>
{
   "totalRecords" : ${totalRecords},
   "recordOffset" : ${recordOffset},
   "issues": [
   <#list issues as issue>
      {
         "key": "${issue.key}",
         "summary": "${issue.fields.summary.value}",
         "project": "${issue.fields.project.value.name}",
         "type": "${issue.fields.issuetype.value.name}",
         "priority": "${issue.fields.priority.value.name}",
         <#-- Could just exclude all issues in the search results with no due date set rather than set an arbitrary default value ? -->
         "duedate": "${issue.fields.duedate.value!"2035-01-01"}",
         "reporter": "${issue.fields.reporter.value.displayName}"
      }<#if issue_has_next>,</#if>
   </#list>
   ]
}
</#escape>