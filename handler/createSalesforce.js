import jsforce from 'jsforce';

const creds = {
  url : 'https://leapeasy--leapdev21.my.salesforce.com/',
  username : 'leapeasy@accelerize360.com.leapdev21',
  password : 'Accleap21',
}

let conn = new jsforce.Connection({
  loginUrl: creds.url
});

async function CreateSalesforce(accountData) {

    try {
        await conn.login(creds.username, creds.password);
        console.log('Connected to Salesforce!');
        for (const [index, data] of accountData.entries()) {
          console.log(index, data);
          // create Account object
          const accountRet = await conn.sobject("Account")
                            .create({
                                Name : data.appName,
                                Account_n__c: Math.floor((Math.random() * 1000000) + 1),
                                Application_type__c: "LDR",
                                Lease_Start_Date__c: data.leaseFromDate,
                                Lease_End_Date__c: data.leaseToDate,
                                Gross_Monthly_Rent__c: data.rent,
                                Total_Number_of_Tenants__c: data.countTenant
                              });
            console.log("Created Account id : " + accountRet.id, 'index'+index);
            
            // create Contact object with Account id
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
              const update_data = {};                    
              // update Account object with contact id
              index++;
              update_data['Id'] = accountRet.id;
              update_data['Tenant_' + index.toString() + '__c'] = contactRet.id;
            
              const accountTenantRet = await conn.sobject("Account")
                                        .update(update_data);
              console.log("Created Contact id : " + accountTenantRet[0]);
                                
              
            }
        }      
        await conn.logout();
    } catch (err) {
        console.error(err);
    }
}

export default CreateSalesforce;