import jsforce from 'jsforce';
import sf_constants from './sf_constants.js';

const creds = {
  url : 'https://leapeasy--leapdev21.my.salesforce.com/',
  username : 'leapeasy@accelerize360.com.leapdev21',
  password : 'Accleap21',
}

let conn = new jsforce.Connection({
  loginUrl: creds.url
});

async function CreateSalesforce(propertyData) {

    try {
        await conn.login(creds.username, creds.password);
        console.log('Connected to Salesforce!');
        let prevData = {};
        for (const [index, data] of propertyData.entries()) {

            let buildingId; let building;

            // get property id with propertyName if exist and create a property object if not exist on SF
            if(data.propertyName != prevData.propertyName) {
                building =  await conn.sobject("Account")
                                                      .find({Name: data.propertyName}, 'Id');
                if(building.length == 0) {
                    building = await conn.sobject("Account").create({
                    Name: data.propertyName,
                    RecordTypeId: sf_constants.RECORDTYPE.development.BUILDINGS
                  });
                  buildingId = building.Id;
                } else {
                  buildingId = building[0].Id;
                }
                console.log('Building Account created with ID', buildingId);
                prevData = data;
            }

            // fnd a application with appName and application type
            const application =  await conn.sobject("Account")
                                                  .find({
                                                    Name : data.appName,
                                                    Application_type__c: "LDR",
                                                  }, 'Id');

            // if application exist, update application's lease start and end date, if not exist, create a new application
            console.log(application.length);
            if(application.length != 0) {
              await conn.sobject("Account")
                                .update({
                                    Id: application[0].Id,
                                    Lease_Start_Date__c: data.leaseFromDate,
                                    Lease_End_Date__c: data.leaseToDate,
                                });

               console.log("Update Account Object id =" + application[0].Id + "with lease start and end date");   

            } else {
                const accountRet = await conn.sobject("Account")
                                                    .create({
                                                        Name : data.appName,
                                                        Application_type__c: "LDR",
                                                        Lease_Start_Date__c: data.leaseFromDate,
                                                        Lease_End_Date__c: data.leaseToDate,
                                                        Gross_Monthly_Rent__c: data.rent,
                                                        Total_Number_of_Tenants__c: data.countTenant,
                                                        APARTMENT_BUILDING__C: buildingId
                                                      });
  
                console.log("Created Account id : " + accountRet.id, 'index'+index);
                                                      
                // Create a related Contacts with Account ID
                const update_data = {};
                for (let [index, tenant] of data.tenant.entries()) {
                    const contactRet = await conn.sobject("Contact")
                                                          .create({
                                                              FirstName : tenant.name.split(' ')[0],
                                                              LastName: tenant.name.split(' ')[1],
                                                              Email: tenant.email,
                                                              Phone: tenant.phoneNumber,
                                                              AccountId: accountRet.id
                                                          });
                    console.log("Created Contact id : " + contactRet.id);
                    
                    index++;
                    update_data['Id'] = accountRet.id;
                    update_data['Tenant_' + index.toString() + '__c'] = contactRet.id;
                    const accountTenantRet = await conn.sobject("Account")
                                                          .update(update_data);
                    console.log("Update Account with tenant " + index + " id : " + accountTenantRet);
                }
            }

        }      
        await conn.logout();
    } catch (err) {
        console.error(err);
    }
}

export default CreateSalesforce;