import cron from 'node-cron';
import EventEmitter from 'events';
import downloadEmailAttachments from 'download-email-attachments';
import moment from 'moment';
const event = new EventEmitter();

import CsvReader from './csvReader.js';

const opDir = "./files";
const email = "prodev.0210@gmail.com";
const password =  "wbazmkcbrwkhdlke"
const port = 993;
const host = 'imap.gmail.com';
const todaysDate = moment().format('YYYY-MM-DD');
var reTry = 1;

var paraObj = {
    invalidChars: /\W/g,
    account: `"${email}":${password}@${host}:${port}`, // all options and params 
    //besides account are optional
    directory: opDir,
    filenameTemplate: '{filename}',
    // filenameTemplate: '{day}-{filename}',
    filenameFilter: /.csv?$/,
    timeout: 10000,
    log: { warn: console.warn, debug: console.info, error: console.error, info: 
    console.info },
    since: todaysDate,
    lastSyncIds: ['234', '234', '5345'], // ids already dowloaded and ignored, helpful 
    //because since is only supporting dates without time
    attachmentHandler: function (attachmentData, callback, errorCB) {
    callback()
   }
  }
 
var onEnd = (result) => {
  if (result.errors || result.error) {
      console.log("Error -------------------------------------> ", result);
      if(reTry < 4 ) {
        console.log('retrying..........................................', reTry++)
        return downloadEmailAttachments(paraObj, onEnd);
      } else  console.log('Failed to download attachment')
  } else {
    // run csv read script after finished downlaoding attached files
    CsvReader();
  };
}

const downloadJob = async () => {
  await downloadEmailAttachments(paraObj, onEnd);
}

const Handler = () => {
    console.log('Registering Jobs');
    const job = cron.schedule('*/1 * * * * *', async() =>
      {
        await downloadJob();
        event.emit('TASK1 COMPLETED');
      },
      {
        scheduled: true,
        timezone: 'America/New_York',
      }
    );
    event.on('TASK1 COMPLETED', () => {
      console.log('task1 done!');
      job.stop();
    });
}

export default Handler;