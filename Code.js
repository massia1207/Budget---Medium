const All = getall();
const Accounts = getAccounts();
const Periods = getPeriods();
const RawData = getData();
const LastMonth = Periods.slice(-1);

//******************************************************************************** */
function doGet() {
  let html = HtmlService.createTemplateFromFile('sidebar');
  html.lastMonth = LastMonth;
  return html.evaluate();
}

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Budget')
    .addItem("Show sidebar", "showBar")
    .addToUi();
  showBar();
}
//TO INCLUDE STYLE SHEET
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename)
    .getContent();
}

function showBar() {
  let html = HtmlService.createTemplateFromFile('sidebar').evaluate();
  html.lastMonth = LastMonth;
  html.setTitle("Medium Budget v1");
  SpreadsheetApp.getUi().showSidebar(html);
}

//********************************************************************************** */
function getall(){
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataSh = ss.getSheetByName('Data');
  const raw = dataSh.getDataRange().getValues();
  const data = raw.splice(1);
  return data;
}

function getData() {
  const data = All;
  let tempArr = []

  //SEED EVERYTHING WITH ALL ACCOUNTS TO AVOID ISSUES WITH MISSING ACCOUNTS IN SOME PERIODS
  Periods.forEach(period => {
    for (let j = 0; j < Accounts.length; j++) {
      e = new Entry(period, Accounts[j], "Marcus", 0);
      tempArr.push(e);
    }
  })

  let records = tempArr.map(record => {
    for (let i = 0; i < data.length; i++) {
      if (record.period == data[i][0] && record.account == data[i][1]) {
        record = { ...record, type: data[i][2], amount: data[i][3] }

      } else { record = { ...record }; }
    }
    return record

  })
  return records;
}
//**************************************************************************************** */

function getBudgetData(m) {
  let myData = [];
  const myPeriods = Periods.slice(-m);
  RawData.forEach(record => {
    if (myPeriods.includes(record.period)) {
      myData.push(record);
    }
  })
  return myData;
}
//************************************************************************************************* */

function budgetSheet(monthCount,esc) {
  //  monthCount=12;
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const destSh = ss.getSheetByName('Budget');
  const data = getBudgetData(monthCount);
  let lastMonthRecords = getLastMonth();
  let myItems = [];

   for(let i = 0; i<Accounts.length; i++){
    // let math = myMath(data[i].account);
    let math = myMath(data, data[i].account, monthCount);
    let item = new ReportItem(data[i].account,math.mySum, math.myAvg, math.myHigh, math.myLow,lastMonthRecords[i].amount);
    myItems.push([item.account,item.myAvg, item.myHigh, item.myLow, item.myLastMonth]);
  }
  
  let LR = destSh.getLastRow();
  destSh.getRange(2,1,LR,6).clearContent();
 
  destSh.getRange(2,1,myItems.length,5).setValues(myItems);
  
  for (let j = 0; j < Accounts.length;j++){
    destSh.getRange(j+2,6).setFormula(`=VLOOKUP(A${j+2},Accounts!A1:B85,2,false)`);
  
      }
  populateForecast(esc);
}
//**************************************************************************************** */

function getLastMonth() {
  let lastMonthRecords = RawData.filter(r => {
    return r.period == LastMonth
  })
  console.log(lastMonthRecords.length);
  return lastMonthRecords;

}

//*********************************************************************************************** */

function myMath(data,account, months) {
  let mySum = 0;
  let myAvg = 0;
  let myHigh = 0;
  let myLow = 100000000;
  let records = data;
  records.forEach(row => {
    if (row.account == account) {
      mySum = mySum + row.amount;
      myAvg = mySum / months;
      if (row.amount > myHigh) { myHigh = row.amount };
      if (row.amount < myLow) { myLow = row.amount };
    }
  })
  return { mySum, myAvg, myHigh, myLow };
}
//***************************************************************************************************** */

// TO GET A LIST OF the DETAIL ACCOUNTS
function getAccounts() {
  const raw = All;
  let accounts = [];
  for (let i = 0; i < raw.length; i++) {
    if (!accounts.includes(raw[i][1])) {
      accounts.push(raw[i][1]);
    };
  }
  
  return accounts;
}
//***************************************************************************************************************** */
function getPeriods() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataSh = ss.getSheetByName('Data');
  const raw = dataSh.getDataRange().getValues();
  let periods = [];
  for (let i = 0; i < raw.length; i++) {
    if (!periods.includes(raw[i][0])) {
      periods.push(raw[i][0]);
    };
  }
  periods.shift();
  periods.reverse();

  return periods;
}
//**************************************************************************************************************** */
// OBJECT TO GET THE DATA WANTED
function Entry(period, account, type, amount) {
  this.period = period;
  this.account = account;
  this.type = type;
  this.amount = amount;
}
/****************************************************************************************************************** */
function ReportItem(account, mySum, myAvg, myHigh, myLow, myLastMonth, myMethod) {
  this.account = account;
  this.mySum = mySum;
  this.myAvg = myAvg;
  this.myHigh = myHigh;
  this.myLow = myLow;
  this.myLastMonth = myLastMonth;
  this.myMethod = myMethod;

}
//**************************************************************************************************************** */

function populateForecast(esc){
  let e = esc
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const destSh = ss.getSheetByName('Budget');
  let LR = destSh.getLastRow(); //85
  let formulaList = [];
   
  for(let i = 0; i<LR-1;i++){
    let method = destSh.getRange(i+2,6).getValue();
    if (method != "Revenue" && method != "Salary & Benefits"){
        formulaList.push('g'+ (i+2));
    } 
  }  
  let rangeList  = destSh.getRangeList(formulaList);
  
  rangeList.getRanges().forEach(cell => {
      let myMethod = cell.offset(0,-1).getA1Notation();
      cell.setFormula(`=BUDGET_23(${myMethod},${e})`);  
     
  })  
}

//*************************************************************************************************** */





