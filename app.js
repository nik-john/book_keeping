'use strict';

const KEY = 'sssasdaawwswwww';

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
        $interval(() => loadTransactions(), 5000);
    };

    var loadTransactions = function () {
        $http.get(apiBase + '/Transactions').then(function (response) {
            //Example API call. Most other calls are posts but how they are done can be seen in the documentation https://docs.angularjs.org/api/ng/service/$http 
            $scope.vd.transactionList = response.data; //this is  what we do on success. Error is not handled here.
            console.log('Number of rows', $scope.vd.transactionList.length);
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

    loadTransactions();
    init(); //Run init here to make sure things we call from init is defined when we call them
}]);

/* End Angular Code */
/* Start  Implementation */
let deDuped = false;
function submitDataForParsing() {
    const text = document.getElementById('text').value;
    if (!text.length) {
        flashMessage('error', 'Please Paste your Bank Data First');
        return false;
    }
    const data = {
        text
    };
    return parseData(data);
}

function parseData(data) {
    return post(`https://bokiotestbankapi.azurewebsites.net/api/${KEY}/Transactions/Parse`, data).then(handleParsedData, error);
}

function handleParsedData(data) {
    return createRawTable(data);
}

function createRawTable(data) {
    // Check for existence
    if (!data.suggestions || !data.suggestions.length) {
        flashMessage('error', 'Whoops! Something is wrong with this Data!');
        return false;
    }
    const tableNode = `
    <div class="tbl-header">
        <table cellpadding="0" cellspacing="0" border="0">
            <thead>
                <tr>
                    ${data.suggestions.map(suggestion => {
        if (!suggestion.options || !suggestion.options.length) {
            flashMessage('error', 'Whoops! Something is wrong with this Data!');
            return;
        }
        return `<th>
                                    <select name="text">
                                        ${suggestion.options.map(option => {
            return `<option value="${option.label}" ${suggestion.selectedOption.key === option.key ? `selected` : ``}>
                                                        ${option.key === 'None' ? ` -- ` : option.label}
                                                    </option>`;
        }).join('')}
                                    </select>
                                </th>`;
    }).join('')}
                </tr>
            </thead>
        </table>
    </div>
    <div class="tbl-content">
        <table cellpadding="0" cellspacing="0" border="0">
            <tbody>
                ${data.rows.map(row => {
        return `<tr onclick="rowClickHandler()">
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
    flashMessage('success', 'Thank you. Click Save to proceed.');
}

function parseTableRowsToTransactions(rows) {
    if (![].slice.call(rows)[0].childNodes[2] || ![].slice.call(rows)[0].childNodes[3] || ![].slice.call(rows)[0].childNodes[4]) {
        flashMessage('error', 'No Data to Save!');
        return false;
    }
    return [].slice.call(rows).map((row, id) => {
        return {
            id,
            date: row.childNodes[2].innerHTML,
            text: row.childNodes[3].innerHTML,
            amount: row.childNodes[4].innerHTML.replace(' ', '').replace(',', '')
        };
    });
}

async function deDupe() {
    const tableRows = document.querySelectorAll('#parsed-table-container .tbl-content tr');
    if (!tableRows.length) {
        flashMessage('error', 'No Data to Save!');
        return false;
    }
    const transactions = parseTableRowsToTransactions(tableRows);
    if (!transactions) {
        flashMessage('error', 'No Data to Save!');
        return false;
    }
    const preppedData = {
        transactions
    };
    return post(`https://bokiotestbankapi.azurewebsites.net/api/${KEY}/Transactions/Preview`, preppedData).then(handleDeDupe, error);
}

function handleDeDupe(data) {
    const parsedData = data.filter(row => !row.ignore);
    const ignoredRows = data.filter(row => row.ignore);
    ignoredRows.map(row => {
        [].slice.call(document.querySelectorAll('#parsed-table-container .tbl-content tr')).map((tableRow, index) => {
            if (index === row.transaction.id) {
                document.querySelectorAll('#parsed-table-container .tbl-content tr')[index].classList.add('dupe');
            }
        });
    });
    document.getElementById('parsed-data').value = JSON.stringify(parsedData);
    document.getElementById('ignored-data').value = JSON.stringify(ignoredRows);
    deDuped = true;
    flashMessage('success', 'Checked for Duplicates. Click again to Save');
}

function addDuplicateRow(index) {
    const ignoredRows = JSON.parse(document.getElementById('ignored-data').value);
    let parsedRows = JSON.parse(document.getElementById('parsed-data').value);
    let duplicateRow;
    duplicateRow = [].slice.call(ignoredRows).filter(row => row.transaction.id === index)[0];
    parsedRows = [...[].slice.call(parsedRows), duplicateRow];
    const updatedIgnoredRows = [].slice.call(ignoredRows).filter(row => row.transaction.id !== index);
    document.getElementById('parsed-data').value = JSON.stringify(parsedRows);
    document.getElementById('ignored-data').value = JSON.stringify(ignoredRows);
}

function handleSave(data) {
    flashMessage('success', 'Saved to Profile');
}

function error(e) {
    flashMessage('error', 'Whoops! Something\'s Wrong!');
    return;
}

async function saveData() {
    if (!deDuped) {
        return await deDupe();
    }
    const parsedData = JSON.parse(document.getElementById('parsed-data').value);
    if (!parseData.length) {
        flashMessage('error', 'No data to Save!');
        return false;
    }
    const preppedData = parsedData.map(row => row.transaction);
    // First deDupe
    await post(`https://bokiotestbankapi.azurewebsites.net/api/${KEY}/Transactions`, preppedData).then(handleSave, error);
    clearFields();
    deDupe = false;
}

function clearFields() {
    document.getElementById('text').value = '';
    document.querySelector('.data-process .tbl-header thead').innerHTML = `<tr>
            <th>Date</th>
            <th>Description</th>
            <th>Amount</th>
        </tr>`;
    document.querySelector('.data-process .tbl-content tbody').innerHTML = '<tr></tr>';
}

async function post(url, body) {
    return new Promise(function (resolve, reject) {
        const request = new XMLHttpRequest();
        request.onload = function () {
            if (this.status === 200) {
                resolve(JSON.parse(this.response));
            } else {
                reject(new Error(this.statusText));
            }
        };
        request.onerror = function () {
            reject(new Error('XMLHttpRequest Error: ' + this.statusText));
        };
        request.open('POST', url);
        request.setRequestHeader('Content-Type', 'application/json');
        request.send(JSON.stringify(body));
    });
}

function rowClickHandler() {
    const rows = document.querySelectorAll('#parsed-table-container .tbl-content tr');
    for (let i = 0; i < rows.length; i++) {
        rows[i].addEventListener("click", e => {
            addDuplicateRow(i);
            rows[i].classList.remove('dupe');
        });
    }
}
/*  Displays self destruction Flash Messages to provide quick
 *  User Feedback
 */
function flashMessage(type, message) {
    document.querySelector('.flash').classList.add('showing');
    document.querySelector('.flash .message').innerHTML = message;
    document.querySelector('.flash .message').classList.add(type);
    setTimeout(() => {
        document.querySelector('.flash').classList.remove('showing');
        document.querySelector('.flash .message').innerHTML = '';
        document.querySelector('.flash .message').classList.remove(type);
    }, 5000);
}

console.log(`NOTES
    
    Features:

    • The user wants to see what they have saved before
    • The user wants to be able to save a new bank data paste
    • If Bokio doesn’t understand the paste perfectly the user might need to change the columns
    • If there are duplicates in the paste then the user might want to choose not to ignore the rows
        Bokio thinks should be ignored.

    Highlights/Enhancements:

    • Application is completely Responsive and uses the lates and greatest CSS, including FlexBox & KeyFrames
    • Introduced SCSS
    • Introduced ES6, ES7 using Babel
    • Used async/await functions and native Promises
    • Maximum functional programming (map, filter etc.)
    • Reset CSS for cross browser consistency
    • Instant feedback through Flash Messages
    • No libraries used. Everything has been coded from scratch
    • Tested for multiple data sets
    • CSS animations on Buttons and Flash messages for Rich UX
    • Error handling has been implemente for all major use cases
    • Made the Angular App long poll for data, so that page reload can be avoided


    TODOs/Nice-to-haves:

    • Commit column change to API
    • Implement the Book Keeping on a Modal instead of block tables
    • Use more Icons and lesser Text

    `);
