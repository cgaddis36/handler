
import { rejects } from "assert";
import csv from "csvtojson";
import fs from 'fs';
import path from 'path';
import CreateSalesforce from './createSalesforce.js';

const directory = './files/attachments'

let csvDataArray = [];
let propertyData = [];
let rentRollCSV = [];
let rentRollData = [];
let rentRollObjectArray = [];
let tN = 1; let unit; let fileN = 0;

const createPropertyData = (objectArray) => {

  objectArray.forEach((data, index) => {
    if(data['Property Name'] && data['Property Address']) {
      if(data['Tenant']) {
        const appName = data['Unit'] + ' ' + '-' + ' ' + data['Property Name'].split(' ')[0];
        const tenantName = data['Tenant'].split(',')[0] + data['Tenant'].split(',')[1];
        const propertyName = data['Property Name'];
        const propertyAddress = data['Property Address'];
  
        let re = /(?:[-+() ]*\d){10,13}/gm; 
        const phoneNumber = data['Phone Numbers'] ? data['Phone Numbers'].match(re).map(function(s){return s.trim();})[0] : '';
        const email = data['Emails'] ? data['Emails'].split(',')[0] : '';
        const leaseFromDate = data['Lease From'] ? new Date(data['Lease From']) : '';
        const leaseToDate = data['Lease To'] ? new Date(data['Lease To']) : '';
        const rent = parseFloat(data['Rent'].replace(/,/g,''));
  
        propertyData.push({
          propertyName: propertyName,
          propertyAddress: propertyAddress,
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
          unit: parseInt(data['Unit'])
        })
  
        objectArray.slice(index+1).forEach((item, ind) => {
          if(data['Unit'] == item['Unit']) {
            tN++;
            if(tN < 5) {
              propertyData[propertyData.length-1].tenant.push({
                name: tenantName,
                phoneNumber: phoneNumber,
                email: email
              });
            }
            propertyData[propertyData.length-1].countTenant = tN;
            objectArray.splice(index+ind+1, 1);
          }
        }) 
        tN = 1;
      } else {
        const propertyName = data['Property Name'];
        const baseRental = parseFloat(data['Base Rental Income'].replace(/,/g,''));
        const approvalFee = data['Deposit Waiver Fee - Approval'];
        const conditionalFee = data['Deposit Waiver Fee - Conditional'];
        const unit = parseInt(data['Unit']);
        rentRollObjectArray.push({
          propertyName: propertyName,
          baseRental: baseRental,
          approvalFee: approvalFee,
          conditionalFee: conditionalFee,
          unit: unit
        })
      
      }
    }
  })

}

const CsvReader = async () => {
  
  try {      
      const files = fs.readdirSync(directory);

      const promise = new Promise((resolve, reject) => {
        let promiseArray = files.map(async file => {
            const jsonArrayObj = await csv() //read csv files from lcaol files folder and parse to json array object.
              .fromFile(directory + '/' + file);
            return csvDataArray.concat(jsonArrayObj);
        })

        Promise.all(promiseArray).then(res => {

          res.forEach(objectArray => {
            createPropertyData(objectArray);
            resolve();
          })
        }).catch(err => {
          console.log(err)
        })
      });

      promise.then(() => {
        propertyData.forEach((property, index) => {
          rentRollObjectArray.forEach(object => {
            if(property.propertyName == object.propertyName && property.unit == object.unit) {
              propertyData[index].baseRental = object.baseRental;
              propertyData[index].approvalFee = object.approvalFee;
              propertyData[index].conditionalFee = object.conditionalFee;
            }
          })
        });
        // console.log(propertyData);
        CreateSalesforce(propertyData);

        // remove attachments after parsed
        fs.readdir(directory, (err, files) => {
          if (err) throw err;
        
          for (const file of files) {
            fs.unlink(path.join(directory, file), err => {
              if (err) throw err;
            });
          }
        })
      });

  } catch (error) {
    console.log(error);
  }
}

export default CsvReader;


