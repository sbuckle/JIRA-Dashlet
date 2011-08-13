<div id="${args.htmlid}-configDialog" class="config-poll">
   <div class="hd">${msg("label.header")}</div>
   <div class="bd">
      <form id="${args.htmlid}-form" action="" method="POST">
      	 <div class="yui-gd">
            <div class="yui-u first"><label for="${args.htmlid}-jiraUser">${msg("label.jiraUsername")}:</label></div>
            <div class="yui-u" >
               <input type="text" name="jiraUser" id="${args.htmlid}-jiraUser" />
            </div>
         </div>
         <div class="yui-gd">
            <div class="yui-u first"><label for="${args.htmlid}-max-items">${msg("label.resultsPerPage")}:</label></div>
            <div class="yui-u">
               <select id="${args.htmlid}-max-items" name="max-items">
                <option value="100">${msg("label.all")}</option>
                <#assign limits = [5, 10, 15]>
                <#list limits as limit><option value="${limit}">${limit}</option></#list>
               </select>
            </div>
         </div>
         <div class="yui-gd">
         	<div class="yui-u first"><label for="${args.htmlid}-jira-url">${msg("label.display")}:</label></div>
         	<div class="yui-u">
         		<div id="${args.htmlid}-picker"></div>
         	</div>	
         </div>
         <div class="bdft">
            <input type="submit" id="${args.htmlid}-ok" value="${msg("button.ok")}" />
            <input type="button" id="${args.htmlid}-cancel" value="${msg("button.cancel")}" />
         </div>
      </form>
   </div>
</div>