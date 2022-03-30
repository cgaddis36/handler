
import csv from "csvtojson";
import fs from 'fs';
import path from 'path';
import CreateSalesforce from './createSalesforce.js';

const directory = './files'
let accountData = [];
let tN = 1; let unit; let fileN = 0;

const CsvReader = async () => {
  
  try {      
      const files = fs.readdirSync(directory)
      files.forEach(file => {

        if(file.includes("tenant_directory")) {
          csv()  //read csv files from lcaol files folder and parse to json array object.
          .fromFile(directory + '/' + file)
          .then(function(jsonArrayObj){ 
            fileN ++;
            // converts jsonArrayObject to accountData object that is then pushed to salesforce.
            jsonArrayObj.forEach((data, index) => {
              if(data['Property Name'] && data['Property Address']) {
                const appName = data['Tenant'].split(',')[0] + ' ' + '-' + ' ' + data['Property Name'].split(' ')[0];
                const tenantName = data['Tenant'].split(',')[0] + data['Tenant'].split(',')[1];
                
                let re = /(?:[-+() ]*\d){10,13}/gm; 
                const phoneNumber = data['Phone Numbers'] ? data['Phone Numbers'].match(re).map(function(s){return s.trim();})[0] : '';
                const email = data['Emails'] ? data['Emails'].split(',')[0] : '';
                const leaseFromDate = data['Lease From'] ? new Date(data['Lease From']) : '';
                const leaseToDate = data['Lease To'] ? new Date(data['Lease To']) : '';
                const rent = parseFloat(data['Rent'].replace(/,/g,''));

                accountData.push({
                  appName: appName,
                  tenant: [{
                    name: tenantName,
                    phoneNumber: phoneNumber,
                    email: email
                  }],
                  countTenant: 1,
                  leaseFromDate: leaseFromDate,
                  leaseToDate: leaseToDate, 
                  rent: rent,
                  unit: data['Unit']
                })

                jsonArrayObj.slice(index+1).forEach((item, ind) => {
                  if(data['Unit'] == item['Unit']) {
                    tN++;
                    if(tN < 5) {
                      accountData[accountData.length-1].tenant.push({
                        name: tenantName,
                        phoneNumber: phoneNumber,
                        email: email
                      });
                    }
                    accountData[accountData.length-1].countTenant = tN;
                    jsonArrayObj.splice(index+ind+1, 1);
                  }
                }) 
                tN = 1;
              }
            })
            if(fileN == files.length) {
              // console.log(accountData);
              CreateSalesforce(accountData);
              fs.readdir(directory, (err, files) => {
                if (err) throw err;
              
                for (const file of files) {
                  fs.unlink(path.join(directory, file), err => {
                    if (err) throw err;
                  });
                }
              });
            }
          })
        }
      });
  } catch (error) {
    console.log(error);
  }
}

export default CsvReader;


