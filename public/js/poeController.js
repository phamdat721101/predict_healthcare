/*
Copyright 2017 BlocLedger

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

var apiUrl = 'http://localhost:5000';
var baseUrl = '.';

(function() {
  'use strict';
  myApp.controller('poeAppCtrl', ['$scope', '$http', function($scope, $http) {
    $scope.hash = 'file hash';
    $scope.fileName = '';
    $scope.data = [];

    $http.get(baseUrl + '/loggedIn').then(function(response) {
      if (response.data.loggedIn) {
        $scope.loggedIn = true;
      } else {
        $scope.loggedIn = false;
      }
    });

    $scope.hashFile = function(file) {
      var reader = new FileReader();
      if (!file) {
        $scope.hash = 'file hash';
        $scope.fileName = 'file name';
      } else {
        $scope.fileName = file.name;
        $scope.hash = 'working...';
        reader.readAsText(file);
        reader.onload = function() {
          var newHash = sha256(reader.result);
          var csv = reader.result
          // alert()
          //convert csv to json
          // let lines = csv.split('\n')
          // let result = [];

          // let headers=lines[0].split(',');

          // for(let i=1;i<lines.length;i++){

          //   let obj = {};
          //   let currentline=lines[i].split(',');

          //   for(let j=0;j<headers.length;j++){
          //     obj[headers[j].replace("\r","")] = parseInt(currentline[j]);
          //   }

          //   result.push(obj);           
          // }

          $scope.data = reader.result;

          $scope.$apply(function() {   //using the $apply will update the hash after the sha256 finishes otherwise it would wait for a mouse click
            $scope.hash = newHash;
          });
        };
      }
    };
    $scope.submit = async function() {
      $scope.showAlert = false;
      $scope.alertMsg = '';
      $scope.showErrorAlert = false;
      $scope.alertErrorMsg = '';

      //Call API to post data
      console.log("Line 80: ", $scope.data)
      let url  = apiUrl + "/evaluate"      
      let resp = await fetch(url, 
        {
          method: 'POST', // or 'PUT'
          headers: {
            'Content-Type': 'application/json',
          },
          body: $scope.data
        }
      );
      let resultApi = await resp.json();
      let rep = await resultApi;

      var params = {
        'hash': $scope.hash,
        'name': rep.accuracy,
        'owner': $scope.owner
      };
      $http.post(baseUrl + '/addDoc', params).then(function(response) {
        console.log(response);
        if (response.data) {
          console.log(response.data);
          $scope.showAlert = true;
          $scope.alertMsg = response.data;
        }
      }, function(response) {
        console.log('an error happened on the $http.post');
        console.log(response.data);
        $scope.showErrorAlert = true;
        $scope.alertErrorMsg = response.data;
      });
    };
  }]).directive('poeApp', function() {
    return {
      controller: 'poeAppCtrl',
      templateUrl: 'templates/poeApp.html'
    };
  });

  myApp.controller('verifyDocCtrl', ['$scope', '$http', '$filter',
  function($scope, $http, $filter) {
    $scope.hash = '';
    $scope.fileName = '';
    $scope.date = '';
    $scope.owner = '';
    $scope.tx = '';

    $http.get(baseUrl + '/loggedIn').then(function(response) {
      if (response.data.loggedIn) {
        $scope.loggedIn = true;
      } else {
        $scope.loggedIn = false;
      }
    });

    $scope.hashFile = function(file) {
      var reader = new FileReader();
      console.log(file);
      if (!file) {
        $scope.hash = '';
        $scope.fileName = '';
      } else {
        $scope.fileName = file.name;
        $scope.hash = 'working...';
        reader.readAsArrayBuffer(file);
        reader.onload = function(evt) {
          console.log(evt);
          var newHash = sha256(reader.result);
          $scope.$apply(function() {   //using the $apply will update the hash after the sha256 finishes otherwise it would wait for a mouse click
            $scope.hash = newHash;
          });
          console.log($scope.hash);
        };
      }
    };
    $scope.verify = function() {
      console.log('verify button pushed.');
      $scope.showAlert = false;
      $scope.alertMsg = '';
      $scope.showErrorAlert = false;
      $scope.alertErrorMsg = '';
      $scope.fileName = '';
      $scope.date = '';
      $scope.owner = '';
      $scope.tx = '';

      function verifyHash(hash) {
        var hashValid = true;
        if (!hash) {
          hashValid = false;
          console.log('no hash provided');
        } else if (hash == 'file hash') {
          hashValid = false;
        } else if (hash.length != 64) {
          hashValid = false;
        }

        if (hashValid === false) {
          console.log('Invalid hash entered.');
        }
        return hashValid;
      }
      if (verifyHash($scope.hash) === true) {
        $http.get(baseUrl + '/verifyDoc/' + $scope.hash)
        .then(function(response) {
          console.log(response);
          if (response.data) {
            if (response.data.Error) {
              $scope.showErrorAlert = true;
              $scope.alertErrorMsg = response.data.Error;
            } else {
              $scope.showAlert = true;
              $scope.alertMsg = 'Document found in the blockchain.';
              $scope.fileName = response.data.Name;
              $scope.owner = response.data.Owner;
              var milliseconds = response.data.Date.Seconds * 1000 +
              response.data.Date.Nanos / 1000000;
              $scope.date = $filter('date')(milliseconds, 'medium');
              $scope.tx = response.data.TxID;
            }
          }
        }, function(response) {
          console.log('an error happened on the $http.post');
          console.log(response.data);
          $scope.showErrorAlert = true;
          $scope.alertErrorMsg = response.data;
        });
      }
    };
  }]).directive('verifyDoc', function() {
    return {
      controller: 'verifyDocCtrl',
      templateUrl: 'templates/verifyDoc.html'
    };
  });

  myApp.controller('listDocCtrl', ['$scope', '$http', '$uibModal',
  function($scope, $http, $uibModal) {
    $http.get(baseUrl + '/loggedIn').then(function(response) {
      if (response.data.loggedIn) {
        $scope.loggedIn = true;
      } else {
        $scope.loggedIn = false;
      }
    });

    $scope.docList = [];
    $http.get(baseUrl + '/listDoc')
    .then(function(response) {
      console.log(response);
      // convert the doc info from string to object
      for (var hash in response.data) {
        var doc = JSON.parse(response.data[hash]);
        response.data[hash] = doc;
      }
      $scope.docList = response.data;
    });

    //Compare model of 2 nodes
    $scope.compare = async function(doc){
      let url  = apiUrl + "/compare"
      let resp = await fetch(url, 
        {
          method: 'GET', // or 'PUT'
          headers: {
            'Content-Type': 'application/json',
          }
        }
      );
      let resultApi = await resp.json();
      let rep = await resultApi;
      alert("This is the best model: " + rep.best_node)
    }

    // Display the transaction details
    $scope.popup = function(txid) {
      $http.get(baseUrl + '/chain/transactions/' + txid)
      .then(function(response) {
        $scope.popupTransaction = response.data;
      })
      .catch(function(response) {
        console.log(response);
      });
    };

    // delete a document
    $scope.delete = function(doc) {
      var modalInstance = $uibModal.open({
        templateUrl: 'templates/confirmModal.html',
        controller: 'confirmModalCtrl',
        size: 'sm',
      });
      modalInstance.result.then(function() {  //Do this if the user selects the OK button
        var params = {
          'hash': doc.Hash,
        };
        $http.post(baseUrl + '/delDoc', params)
        .then(function(response) {
          console.log('document %s deleted', doc.Hash);
          //  refresh the list...
          var newList = $scope.docList;
          delete newList[doc.Hash];
          $scope.doclist = newList;
        });
      }, function() {
        console.log('Modal dismissed at: ' + new Date());
      });
    };

    //  Retrain a document record.
    $scope.retrain = async function(editDoc) {
      console.log("Line 302: ",editDoc.Owner)
      var user = editDoc.Owner
      var url  = apiUrl + "/retrain"
      if(user == "node2@gmail.com"){
        url  = "http://localhost:6000"  + "/retrain"
      }else if(user == "node3@gmail.com"){
        url  = "http://localhost:7000"  + "/retrain"
      }
      var modalInstance = $uibModal.open({
        templateUrl: 'templates/editModal.html',
        controller: 'editModalCtrl',
        size: '',
        resolve: {
          doc: function() {
            return editDoc;
          }
        }
      });
      modalInstance.result.then(async function(doc) {  //Do this if the user selects the OK button
        console.log("PQD: ", url)
        let resp = await fetch(url, 
          {
            method: 'POST', // or 'PUT'
            headers: {
              'Content-Type': 'application/json',
            },
            body:JSON.stringify({
              "best_node": parseInt(doc.Owner)
            })
          }
        );
        let resultApi = await resp.json();
        let rep = await resultApi;
        console.log("Line 320: ", rep.accuracy)
        var params = {
          'hash': doc.Hash,
          'name': rep.accuracy
        }; 
        $http.post(baseUrl + '/editDoc', params)
        .then(function(response) {
          console.log('document %s has changed', doc.Hash);
          //  refresh the list...
          var newList = $scope.docList;
          newList[doc.Hash] = doc;
          $scope.doclist = newList;
        }).catch(err => {
          console.log("Line 328: ", err)
        });
      }, function() {
        console.log('Modal dismissed at: ' + new Date());
      });
    };
  }]).directive('listDoc', function() {
    return {
      controller: 'listDocCtrl',
      templateUrl: 'templates/listDoc.html'
    };
  });

  myApp.controller('confirmModalCtrl', ['$scope', '$uibModalInstance',
  function($scope, $uibModalInstance) {
    console.log('In confirmModalCtrl');

    $scope.ok = function() {
      console.log('ok button pressed');
      $uibModalInstance.close();
    };
    $scope.cancel = function() {
      console.log('cancel button pressed');
      $uibModalInstance.dismiss();
    };
  }]);

  myApp.controller('editModalCtrl', ['$scope', '$uibModalInstance', 'doc',
  function($scope, $uibModalInstance, doc) {
    console.log('In editModalCtrl');
    $scope.owner = doc.Owner;
    $scope.editDoc = doc;

    $scope.ok = function() {
      console.log('ok button pressed');
      $scope.editDoc.Owner = $scope.owner;
      $uibModalInstance.close($scope.editDoc);
    };
    $scope.cancel = function() {
      console.log('cancel button pressed');
      $uibModalInstance.dismiss();
    };
  }]);
})();
