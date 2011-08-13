(function()
{
   /**
    * YUI Library aliases
    */
   var Dom = YAHOO.util.Dom,
      Event = YAHOO.util.Event;
     
   /**
    * Alfresco Slingshot aliases
    */
   var $html = Alfresco.util.encodeHTML,
      $combine = Alfresco.util.combinePaths;

   /**
    * Dashboard JIRA Issue List constructor.
    * 
    * @param {String} htmlId The HTML id of the parent element
    * @return {Alfresco.dashlet.IssueList} The new component instance
    * @constructor
    */
   Alfresco.dashlet.IssueList = function(htmlId)
   {
      Alfresco.dashlet.IssueList.superclass.constructor.call(this, "Alfresco.dashlet.IssueList", htmlId, ["button", "container", "datasource", "datatable", "paginator", "history", "animation"]);
      this.configDialog = null;
      
      return this;
   };

   /**
    * Extend from Alfresco.component.Base and add class implementation
    */
   YAHOO.extend(Alfresco.dashlet.IssueList, Alfresco.component.Base);
   
   YAHOO.lang.augmentObject(Alfresco.dashlet.IssueList.prototype,
   {
      /**
       * Object container for initialization options
       *
       * @property options
       * @type object
       */
      options:
      {
    	  /**
           * The component id.
           *
           * @property componentId
           * @type string
           */
          componentId: "",
          
    	  /**
    	   * The base URL of your JIRA instance.
    	   * Used to turn the key property of an issue into
    	   * a link to the issue itself, e.g http://<jira>/browse/MY-ISSUE
    	   * 
    	   * @property jiraUrl
    	   * @type string
    	   * @default null
    	   */
    	  jiraUrl: null,
    	  
    	  /**
           * JIRA username of the user
           * 
           * @property twitterUser
           * @type string
           * @default ""
           */
    	  jiraUser: "",
    	  
    	  /**
    	   * @property filters
    	   * @type Array
    	   * @default []
    	   */
    	  filters: [],
    	  /**
    	   * Number of issues to display at any one time
    	   *
    	   * @property maxItems
    	   * @type int
    	   * @default 100
    	   */
    	  maxItems: 100
      },

      /**
       * Holds the value of the currently selected filter
       * from the dropdown menu.
       * 
       * @property currentFilterValue
       * @type string
       * @default "all"
       */
      currentFilterValue: "all",
      
      /**
       * Maintains a map of filter value to parameters to send.
       * 
       * @property filterMap
       * @type Object
       */
      filterMap: {
    	  "next": encodeURIComponent(">=now(),<=\"5d\""),
    	  "overdue": encodeURIComponent("<now()"),
    	  "today": encodeURIComponent("=now()")
      },
      
      /**
       * Datatable object
       * 
       * @property dataTable
       * @type object
       * @default null
       */
      dataTable: null,
      
      /**
       * Datasource object
       * 
       * @property dataSource
       * @type object
       * @default null
       */
      dataSource: null,
      
      /**
       * Fired by YUI when parent element is available for scripting
       * 
       * @method onReady
       */
      onReady: function Issues_onReady()
      {
    	  Event.addListener(this.id + "-configure-link", "click", this.onConfigClick, this, true);
    	  Event.addListener(this.id + "-refresh", "click", this.onRefresh, this, true);
    	  
    	  this.init();
      },
      
      /**
       * Initialise the dashlet display 
       * 
       * @method init
       */
      init: function Issues_init()
      {
    	  this.loadData();
    	  
    	  var onMenuClick = function(events, args) {
    		  issueFilterDropDown.set("label", args[1].cfg.getProperty("text"));
    		  this.currentFilterValue = args[1].value;
    		  this.refresh();
    	  };
    	  
    	  var issueFilterDropDown = Alfresco.util.createYUIButton(this, "filters", onMenuClick, 
    	  {
              type: "menu",
              menu: this.options.filters,
              lazyloadmenu: false
           });
    	  
    	  if (this.options.filters.length > 0) {
        	 issueFilterDropDown.set("label", this.options.filters[0].text);
    	  }
         	
    	  Dom.removeClass(this.id + "-filters", "hide");
      },
      
      /**
       * Boolean that indicates whether the dialog column elements
       * have been initialized or not.
       * 
       * @property initColumns
       * @type boolean
       * @default true
       */
      initColumns: true,
      
      /**
       * Configuration click handler
       *
       * @method onConfigClick
       * @param e {object} Click event
       */
      onConfigClick: function(e)
      {
    	  Event.stopEvent(e);
    	  var actionUrl = Alfresco.constants.URL_SERVICECONTEXT + "modules/dashlet/config/" + encodeURIComponent(this.options.componentId);
    	  
    	  if (!this.configDialog) {
             this.configDialog = new Alfresco.module.SimpleDialog(this.id + "-configDialog").setOptions({
                width: "50em",
                templateUrl: Alfresco.constants.URL_SERVICECONTEXT + "webteq/modules/dashlets/jira-issues-config",
                actionUrl: actionUrl,
                onSuccess:
                {
                   fn: function TrainTimes_onConfigPoll_callback(e)
                   {
                	  this.options.jiraUser = Dom.get(this.configDialog.id + "-jiraUser").value;
                	  this.options.maxItems = Dom.get(this.configDialog.id + "-max-items").value;
                	  
                	  var state = this.dataTable.getState();
                      if (state.pagination) {
                    	  state.pagination.rowsPerPage = this.options.maxItems;
                    	  state.pagination.paginator.set('rowsPerPage', this.options.maxItems);
                      }
                      
                      this.refresh(); // Refresh the data with the new settings
                   },
                   scope: this
                },
                doSetupFormsValidation:
                {
                   fn: function Issues_doSetupForm_callback(form)
                   {
                      Dom.get(this.configDialog.id + "-jiraUser").value = this.options.jiraUser;

                      // Search term is mandatory
                      this.configDialog.form.addValidation(this.configDialog.id + "-jiraUser", Alfresco.forms.validation.mandatory, null, "keyup");
                      this.configDialog.form.addValidation(this.configDialog.id + "-jiraUser", Alfresco.forms.validation.mandatory, null, "blur");
                   },
                   scope: this
                },
                doBeforeDialogShow:
                {
                	fn: function Issues_beforeDialogShows_callback(form) 
             		{
                		if (this.initColumns) {
                  		  var columns = this.dataTable.getColumnSet().keys;
                  		  var picker = Dom.get(this.configDialog.id + "-picker");
                  		  var onClickObj = { fn: this.handleButtonClick, obj: this, scope: false };
                  		  
                  		  var column, key, buttonGroup,
                  		  	i, len=columns.length;
                  		  for (i = 0; i < len; i += 1) {
                  			  column = columns[i];
                  			  var checkBtn = new YAHOO.widget.Button({
                  				  type: "checkbox",
                  				  id: this.configDialog.id + "-btn" + i,
                  				  name: "showcolumns",  
                  				  value: column.getKey(),	
                  				  label: column.label,
                  				  checked: !column.hidden,
                  				  container: picker,
                  				  onclick: onClickObj
                  			  });  
                  		  }
                  		  this.initColumns = false;
                  	  	}
                	},
                	scope: this
                }
             });
          } else {
             this.configDialog.setOptions({
                actionUrl: actionUrl
             });
          }
    	  
    	  this.configDialog.show();
      },
      
      handleButtonClick: function (e, oSelf)
      {
    	  var key = this.get("value");
    	  if (this.get("checked")) {
    		  oSelf.dataTable.showColumn(key);
    	  } else {
    		  oSelf.dataTable.hideColumn(key);
    	  }
      },
      
      /**
       * Event handler for refresh click
       * 
       * @method onRefresh
       * @param e {object} Event
       */
      onRefresh: function Issues_onRefresh(e)
      {
         if (e) {
            Event.preventDefault(e);
         }
         this.refresh();
      },
      
      /**
       * Refresh issue data
       * 
       * @method refresh
       */
      refresh: function Issues_refesh()
      {
         var state = this.dataTable.getState(),
         	request, 
         	callback;
         
         callback = {
             success: this.dataTable.onDataReturnSetRows,
       	     failure: this.dataTable.onDataReturnSetRows,
       	     scope: this.dataTable,
       	     argument: this.dataTable.getState() 
         };
         
         request = this.dataTable.get("generateRequest")(state, this.dataTable);
         
         this.dataSource.sendRequest(request, callback);
      },
      
      /**
       * Load JIRA issues and render in the dashlet
       * 
       * @method loadData
       */
      loadData: function Issues_loadData()
      {  
    	  var issueDataSource = new YAHOO.util.DataSource(Alfresco.constants.URL_SERVICECONTEXT + "/webteq/modules/dashlets/jira-issues-search?");
    	  issueDataSource.responseType = YAHOO.util.DataSource.TYPE_JSON;
    	  issueDataSource.responseSchema = {
    			  resultsList: "issues",
    			  fields: ["key",
    			           { key: "duedate", parser: "date" },
					       "summary",
					       "type",
					       "priority"],
			       metaFields: {
						 totalRecords: "totalRecords",
						 recordOffset: "recordOffset"
				   }  
    	  };
    	  
    	  var that = this;
    	  var generateRequest = function (state, self) {
	   	      state = state || { pagination: null, sortedBy: null };
	   	      var sort = (state.sortedBy) ? state.sortedBy.key : "duedate";
	   	      var dir = (state.sortedBy && state.sortedBy.dir === YAHOO.widget.DataTable.CLASS_DESC) ? "desc" : "asc";
	   	      var startAt = (state.pagination) ? state.pagination.recordOffset : 0; 
	   	      var duedate = that.filterMap[ that.currentFilterValue ] || "";
	   	      var rowsPerPage = (state.pagination) ? state.pagination.rowsPerPage : that.options.maxItems;
	   	      var assignee = encodeURIComponent(that.options.jiraUser);
	   	      
	   	      return "&sort=" + sort +
		  		 	 "&dir=" + dir +
		  		 	 "&startAt=" + startAt +
		  		 	 "&results=" + rowsPerPage +
		  		 	 "&duedate=" + duedate +
		  		 	 "&assignee=" + assignee;
    	  };
    	  
    	  var config = {
    			  generateRequest: generateRequest,
    			  initialRequest: generateRequest(), // Initial request for the first page of data
    			  dynamicData: true,
    			  paginator: new YAHOO.widget.Paginator({ 
    				  containers: [this.id + "-paginator"], 
    				  rowsPerPage: this.options.maxItems,
    				  template : this.msg("pagination.template")
    			  }),
    			  sortedBy : {key:"duedate", dir:YAHOO.widget.DataTable.CLASS_ASC},
    			  MSG_EMPTY: this.msg("msg.empty"),
    			  MSG_LOADING: this.msg("msg.loading")
    	  };
    	  
    	  var formatDate = function (elCell, oRecord, oColumn, oData) {
    		  var theDate = oData, sMonth, innerHTML;
    		  // Some issues can have an empty due date; if so, the default 
    		  // value is currently a date way in the future, currently 01/01/2035.
    		  // The alternative is to not return any issues that have a missing due date.
    		  if (theDate.getFullYear() !== 2035) {
    			  switch(theDate.getMonth()) {
    		        case 0:
    		            sMonth = "Jan";
    		            break;
    		        case 1:
    		            sMonth = "Feb";
    		            break;
    		        case 2:
    		            sMonth = "Mar";
    		            break;
    		        case 3:
    		            sMonth = "Apr";
    		            break;
    		        case 4:
    		            sMonth = "May";
    		            break;
    		        case 5:
    		            sMonth = "Jun";
    		            break;
    		        case 6:
    		            sMonth = "Jul";
    		            break;
    		        case 7:
    		            sMonth = "Aug";
    		            break;
    		        case 8:
    		            sMonth = "Sep";
    		            break;
    		        case 9:
    		            sMonth = "Oct";
    		            break;
    		        case 10:
    		            sMonth = "Nov";
    		            break;
    		        case 11:
    		            sMonth = "Dec";
    		            break;
    			  }
    			  innerHTML = theDate.getDate() + "/" + sMonth + "/" + theDate.getFullYear();
    		  } else {
    			  innerHTML = "--";
    		  }
    		  elCell.innerHTML = innerHTML;
    	  };
    	 
    	  var columnDefs = [{ key: "key", label: this.msg("th.id"), sortable: false, formatter: this.bind(this.renderKeyField) },
    	                    { key: "duedate", label: this.msg("th.dueDate"), formatter: formatDate, sortable: true },
    	                    { key: "summary", label: this.msg("th.summary"), sortable: false },
    	                    { key: "type", label: this.msg("th.type"), hidden: true, sortable: true },
    	                    { key: "priority", label: this.msg("th.priority"), hidden: true, sortable: true }];    	  
    	  
    	  var issueDataTable = new YAHOO.widget.DataTable(this.id + "-body", columnDefs, issueDataSource, config);
    	  issueDataTable.doBeforeLoadData = function(request, response, payload) {
    		  payload.totalRecords = response.meta.totalRecords;
    		  payload.pagination.recordOffset = response.meta.recordOffset;
    		  return payload;
    	  }
    	  
    	  this.dataSource = issueDataSource;
    	  this.dataTable = issueDataTable;
      },
      
      renderKeyField: function Issues_renderKeyField(elCell, oRecord, oColumn, oData)
      { 
    	  var str, params = {
              "issueKey": encodeURIComponent(oRecord.getData("key"))
    	  };
    	  
    	  if (this.options.jiraUrl) {
    		  params["url"] = this.options.jiraUrl;
    		  str = '<a href="{url}/browse/{issueKey}" target="_blank">{issueKey}</a>';
    	  } else {
    		  str = "{issuekey}";
    	  }
    	  
    	  elCell.innerHTML = YAHOO.lang.substitute(str, params);
      }
      
   });
})();
