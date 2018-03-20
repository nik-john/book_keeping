const KEY = 'asddfas';

var app = angular.module('app', []);

app.config(['$qProvider', function ($qProvider) {
    $qProvider.errorOnUnhandledRejections(false);
}]);

app.controller('main', ['$scope', '$http', '$interval', function ($scope, $http, $interval) {

    $scope.vd = {}; //By placing primitives on the viewdata object instead of directly on the scope we can avoid problems with angular copying the scope for ng-if and ng-repeat

    $scope.vd.apiKey = KEY; //Set this to some random key to avoid colliding with other people doing the test.
    if (!$scope.vd.apiKey) {
        alert('No API-key set. Please do that in app.js');
    }

    var apiBase = 'https://bokiotestbankapi.azurewebsites.net/api/' + $scope.vd.apiKey;

    var init = function () {
        $interval(() => loadTransactions(), 2000);
    }

    var loadTransactions = function () {
        $http.get(apiBase + '/Transactions').then(function (response) { //Example API call. Most other calls are posts but how they are done can be seen in the documentation https://docs.angularjs.org/api/ng/service/$http 
            $scope.vd.transactionList = response.data; //this is  what we do on success. Error is not handled here.
        });
    };

    $scope.vd.addSample = function () {
        $http.post(apiBase + '/Transactions', [{
            date: '2017-01-01',
            text: 'Test',
            amount: 2000
        }]).then(function (response) {
            loadTransactions();
        });
    };

    init(); //Run init here to make sure things we call from init is defined when we call them
}]);

/* End Angular Code */
/* Start  Implementation */
function submitDataForParsing() {
    const text = document.getElementById('text').value;
    const data = {
        text
    };
    return parseData(data);
}

function parseData(data) {
    return post(`https://bokiotestbankapi.azurewebsites.net/api/${KEY}/Transactions/Parse`, data)
        .then(handleParsedData, error);
}

function handleParsedData(data) {
    createRawTable(data);
}

function createRawTable(data) {
    // Check for existence
    const tableNode = `
    <div class="tbl-header">
        <table cellpadding="0" cellspacing="0" border="0">
            <thead>
                <tr>
                    ${data.suggestions.map(suggestion => {
            return `<th>
                                    <select name="text">
                                        ${suggestion.options.map(option => {
                    return `<option value="${option.label}" ${suggestion.selectedOption.key === option.key ? `selected` : ``}>
                                                        ${option.key === 'None' ? ` -- ` : option.label}
                                                    </option>`;
                }).join('')}
                                    </select>
                                </th>`
        }).join('')}
                </tr>
            </thead>
        </table>
    </div>
    <div class="tbl-content">
        <table cellpadding="0" cellspacing="0" border="0">
            <tbody>
                ${data.rows.map(row => {
            return `<tr>
                    ${row.cells.map(cell => {
                    return `<td>${cell.cleanedValue}</td>`;
                }).join('')}
                    </tr>`;
        }).join('')}
            </tbody>
        </table>
    </div>`;
    document.getElementById('raw-data').value = data;
    document.getElementById('parsed-table-container').innerHTML = tableNode;
}

// function createPreviewTable(data) {
//     // Check for existence
//     // Change table headers to dynamic
//     const tableNode = `
//     <div class="tbl-header">
//         <table cellpadding="0" cellspacing="0" border="0">
//             <thead>
//                 <tr>
//                     <th>Date</th>
//                     <th>Text</th>
//                     <th>Amount</th>
//                 </tr>
//             </thead>
//         </table>
//     </div>
//     <div class="tbl-content">
//         <table cellpadding="0" cellspacing="0" border="0">
//             <tbody>
//                 ${data
//             .filter(row => !row.ignore)
//             .map(row => {
//                 return `<tr>           
//                             <td>${row.transaction.date}</td>
//                             <td>${row.transaction.text}</td>
//                             <td>${row.transaction.amount}</td>
//                         </tr>`;
//             }).join('')}
//             </tbody>
//         </table>
//     </div>`;
//     document.getElementById('parsed-table-container').innerHTML = tableNode;
// }

function parseTableRowsToTransactions(rows) {
    return [].slice.call(rows)
        .map((row, id) => {
            return {
                id,
                date: row.childNodes[2].innerHTML,
                text: row.childNodes[3].innerHTML,
                amount: row.childNodes[4].innerHTML.replace(' ', '').replace(',', '')
            }
        });
}
async function deDupe() {
    const tableRows = document.querySelectorAll('#parsed-table-container .tbl-content tr');
    const preppedData = {
        transactions: parseTableRowsToTransactions(tableRows)
    };
    return post(`https://bokiotestbankapi.azurewebsites.net/api/${KEY}/Transactions/Preview`, preppedData)
        .then(handlePreview, error);
}
function handlePreview(data) {
    const parsedData = data.filter(row => row.ignore);
    parsedData.map( row => {
        [].slice.call(document.querySelectorAll('#parsed-table-container .tbl-content tr'))
        .map((tableRow, index) => {
            if(index === row.transaction.id) {
                document.querySelectorAll('#parsed-table-container .tbl-content tr')[index].classList.add('dupe');
            }
        });
    });
    document.getElementById('parsed-data').value = JSON.stringify(parsedData);
    // createPreviewTable(data);
}
function handleSave(data) {
    console.log("Saved");
}
function error(e) {
    console.log("Error", e);
    return;
}
async function saveData() {
    // First deDupe
    await deDupe();
    const parsedData = JSON.parse(document.getElementById('parsed-data').value);
    const preppedData = parsedData.map(row => row.transaction);
    await post(`https://bokiotestbankapi.azurewebsites.net/api/${KEY}/Transactions`, preppedData)
        .then(handleSave, error);

}

function post(url, body) {
    return new Promise(
        function (resolve, reject) {
            const request = new XMLHttpRequest();
            request.onload = function () {
                if (this.status === 200) {
                    resolve(JSON.parse(this.response));
                } else {
                    reject(new Error(this.statusText));
                }
            }
            request.onerror = function () {
                reject(new Error(
                    'XMLHttpRequest Error: ' + this.statusText));
            };
            request.open('POST', url);
            request.setRequestHeader('Content-Type', 'application/json');
            request.send(JSON.stringify(body));
        });
}

console.log(
    `/*  Features, Bugs and TODOs Etc. */
    Features:

    • The user wants to see what they have saved before
    • The user wants to be able to save a new bank data paste
    • If Bokio doesn’t understand the paste perfectly the user might need to change the columns
    • If there are duplicates in the paste then the user might want to choose not to ignore the rows
    Bokio thinks should be ignored.

    Enhancements:
    • Made the Angular App long poll for data, so that page reload can be avoided
    • Introduced SCSS
    • Introduced ES6 using Babel
    • 
    • 
    • 
    • 

    TODOs/Nice-to-haves:
    • 
    • 
    • 
    • 

    `
);