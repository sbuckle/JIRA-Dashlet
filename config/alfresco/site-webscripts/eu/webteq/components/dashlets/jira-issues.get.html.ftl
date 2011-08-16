<#assign elem=args.htmlid?js_string>
<script type="text/javascript">//<![CDATA[
new Alfresco.dashlet.IssueList("${elem}").setOptions(
{
  componentId: "${instance.object.id}",
  <#if jiraUrl??>
  jiraUrl: "${jiraUrl}",
  </#if>
  jiraUser: "${(jiraUser!"")?js_string}",
  pageSize: ${pageSize!"100"},
  columns: [<#list columns as column>"${column?js_string}"<#if column_has_next>,</#if></#list>],
  filters:
  [<#list filters as filter>
   {
     "text": "${msg(filter.label)?js_string}",
     "value": "${filter.value?js_string}"            
   }<#if filter_has_next>,</#if>
  </#list>]
}).setMessages(
	${messages}
);
new Alfresco.widget.DashletResizer("${elem}", "${instance.object.id}");
//]]></script>
<div class="dashlet my-jira-issues">
   <div class="title">${msg("title")}</div>
   <div class="refresh"><a id="${args.htmlid}-refresh" href="#">&nbsp;</a></div>
   <div class="toolbar">
    <div class="actions">
         <a href="#" id="${args.htmlid}-configure-link" class="theme-color-1">${msg("link.configure")}</a>
      </div>
   	<div><button id="${elem}-filters" class="hide"></button></div>
   </div>
   <div class="toolbar">
   	<div id="${elem}-paginator" class="paginator">&nbsp;</div>
   </div>
   <div class="body scrollableList" id="${args.htmlid}-body">
   </div>
</div>