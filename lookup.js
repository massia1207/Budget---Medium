function findMethod(account) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const dataSh = ss.getSheetByName('Accounts');
  const raw = dataSh.getDataRange().getValues();
  const accountData = raw.splice(1);
  let map  = new Map;

  for (let i= 0; i<accountData.length; i++){
    map.set(accountData[i][0],accountData[i][1]);

  }
  
  // return map[account];
  // console.log(map.get(account))
  return map.get(account)
}
