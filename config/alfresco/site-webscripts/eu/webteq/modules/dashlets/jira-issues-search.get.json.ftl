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
         "duedate": "<#if issue.fields.duedate.value??>${issue.fields.duedate.value?replace("-", "/")}<#else>2035/01/05</#if>",
         "reporter": "${issue.fields.reporter.value.displayName}"
      }<#if issue_has_next>,</#if>
   </#list>
   ]
}
</#escape>