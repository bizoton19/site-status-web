<template>
<div >
      <ul class="nav nav-tabs" id="myTab" role="tablist">
        <li class="nav-item">
          <a class="nav-link active" id="cardDisplay-tab" data-toggle="tab" role="tab" aria-controls="cardDisplay" href="#cardDisplay" aria-selected="false" >Statuses</a>
         
        
        </li>
        <li class="nav-item">
          <a class="nav-link" id="urls-tab" data-toggle="tab" href="#urls" role="tab" aria-controls="urls" aria-selected="false">Url Management</a>
        </li>

        <!--<li class="nav-item">
          <a class="nav-link" id="statusHistory-tab" data-toggle="tab" href="#statusHistory" role="tab" aria-controls="statusHistory" aria-selected="false">Status History</a>
        </li>-->
       
    
      </ul>
      <div class="tab-content" id="myTabContent">
    
    
        <div class="tab-pane fade show active" id="cardDisplay" role="tabpanel" aria-labelledby="cardDisplay-tab">
            <div class="form-control">
                <button @click="onRefreshBtnClicked()" type="button" class="btn btn-primary btn-lg btn-block">Refresh </button>
    
              </div>
              <div v-show="fetching" class="progress">
                <div class="progress-bar progress-bar-striped bg-danger progress-bar-animated" role="progressbar" aria-valuenow="75" aria-valuemin="0"
                  aria-valuemax="100" style="width: 75%"></div>
              </div>
              
            <div v-show="!fetching && !showStatusPanel" class="card-columns">
                <div v-for="status in statuses" class="card bg-transparent border-success mb-3"
                v-bind:class="{ 'card bg-transparent border-success mb-3':status.status==='OK', 'card border-danger mb-3': status.status!=='OK' }">
                <div class="card-header">{{status.urlName}}
    
                </div>
                  <div class="card-body">
                    <p class="card-text">{{status.url}}</p>
                    <h3 v-if="status.status==='OK'" class="card-text">
                        <i class="fas fa-check-circle" style="color:green;"></i>
                    </h3>
                    <h3 v-else class="card-text">
                        <i class="fas fa-exclamation-circle" style="color:red;"></i>
                        
                    </h3>
                    <p class="card-text"><small class="text-muted">Last updated: {{status.date}}</small></p>
                  </div>
                  <div v-if="status.status!=='OK'" class="card-footer">
                     Http Error: {{status.description}}
                  </div>
                </div>
            </div>
            
              <div v-show="showStatusPanel" class="well well-lg">Status refresh Submitted Successfully....Refresh the page (F5) in a few secondes for new data</div>
            
        </div>
    
    
        <div class="tab-pane fade" id="urls" role="tabpanel" aria-labelledby="urls-tab">
          <hr/>
        <url-manager></url-manager>
        </div>
        <!--<div class="tab-pane fade" id="statusHistory" role="tabpanel" aria-labelledby="statusHistory-tab">
          <hr/>
          <div class="container">
      <div class="Chart__list">
        <div class="Chart">
          <h2>Linechart</h2>
        <status-history></status-history>
        </div>
        </div>
        </div>
        </div>-->
  
      </div>
      </div>
      </template>

      <script>
import axios from "axios";
import moment from "moment";
import _ from "lodash";
import urlManager from "./UrlManager.vue"
import statusHistory from "./StatusHistory.vue"

export default {
  name: "poller",
  components: {
    axios,
    moment,
    urlManager,
    statusHistory
  },
  data: function() {
    return {
      response: {
        data: "",
        status: "",
        statusText: ""
      },
      fetching: "false",
      statuses: [],
      selectedStatus: {
        urlName: "",
        url: ""
      },

      statusListEndPoint:
        "https://functions-cpsc1.azurewebsites.net/api/statuses",
      statusRemoverEndPoint:
        "https://functions-cpsc1.azurewebsites.net/api/status",

      statusRefreshEndPoint: "https://functions-cpsc1.azurewebsites.net/api/poller"
    };
  },

  mounted: function() {
    this.getStatuses();
  },
  methods: {
    onRefreshBtnClicked() {
      this.fetching = true;
      this.statuses = [];
      
      this.refreshPollStatuses();
      this.getStatuses();
    },

    getStatuses() {
      var vm = this;
      vm.statuses = [];
      axios
        .get(vm.statusListEndPoint, {
          withCredentials: false
        })
        .catch(function(error) {
          
          if (error.response) {
            // The request was made and the server responded with a status code
            // that falls out of the range of 2xx
            vm.response.data = JSON.stringify(error.response);
            vm.response.status = error.response.status;
          }
          vm.fetching = false;
        })
        .then(function(response) {
          //console.log(response)
          if (response) {
            var status = {};
            let data = response.data.forEach(i => {
              status = {
                rowKey: i.RowKey,
                urlName: i.UrlName,
                url: i.Url,
                description: i.Description,
                status: i.Status,
                date: new moment(i.Date).format("MMMM Do YYYY, h:mm:ss a")
              };

              let found = vm.statuses.find(element => {
                return element.urlName === status.urlName;
              });
              console.log(found);
              vm.statuses.push(status);
            });
          }
          vm.statuses.sort(function(a, b) {
            let statusA = a.status;
            let statusB = b.status;
            if (statusA < statusB) {
              return -1;
            }
            if (statusA > statusB) {
              return 1;
            }

            return 0;
          });
          vm.fetching = false;
        });
    },
    refreshPollStatuses() {
      var vm = this;
      this.statusRefreshRequested = true
      axios
        .get(vm.statusRefreshEndPoint, {
          withCredentials: false
        })
        .catch(function(error) {
         
          if (error.response) {
            vm.response.data = JSON.stringify(error.response)
            vm.response.status = error.response.status
          }
          vm.fetching = false;
        })
        .then(function(response) {
          console.log(response);
          if (response) {
            vm.response.status = response.status;
            if(response.status){
              vm.toggleStatusPanel()
              
            }
          }
          vm.fetching = false
          
        });
    },
    toggleStatusPanel(){
      let vm = this;
        vm.showStatusPanel = true
      
    }
  }
};
</script>