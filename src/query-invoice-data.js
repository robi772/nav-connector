const { pick, mapKeys } = require('lodash');

const createBaseRequest = require('./create-base-request.js');
const sendRequest = require('./send-request.js');

const xml2js = require('xml2js');
const { promisify } = require('util');
const xmlParser = new xml2js.Parser({ explicitArray: false });
const parseXml = promisify(xmlParser.parseString).bind(xmlParser);
const zlib = require('zlib');
const { deflate, unzip,gunzip } = require('zlib');


/**
 * Query previously sent invoices with invoice number or query params.
 * @async
 * @param {Object} params Function params.
 * @param {Object} params.invoiceQuery Query single invoice with invoice number.
 * @param {Object} params.technicalUser Technical user’s data.
 * @param {Object} params.softwareData Invoice software data.
 * @param {Object} params.axios Axios instance.
 * @returns {Promise<Object>} queryResults
 */
module.exports = async function queryInvoiceData({
  invoiceQuery,
  technicalUser,
  softwareData,
  axios,
}) {
  const request = createBaseRequest({
    requestType: 'QueryInvoiceDataRequest',
    technicalUser,
    softwareData,
  });

  /* Normalize invoiceQuery key order. */
  Object.assign(request.QueryInvoiceDataRequest, {
    invoiceNumberQuery: pick(invoiceQuery, [
      'invoiceNumber',
      'invoiceDirection',
      'supplierTaxNumber'
    ]),
  });

  const responseData = await sendRequest({
    request,
    axios,
    path: '/queryInvoiceData',
  });

  const { invoiceDataResult } = responseData.QueryInvoiceDataResponse;

  if (!invoiceDataResult) {
    return responseData;
  }
  if (invoiceDataResult.compressedContentIndicator === 'true') {
    console.log('Compressed content');
  // var t = Buffer.from(invoiceDataResult.invoiceData, 'base64');
    //console.log(invoiceDataResult.invoiceData);

    /*
     await zlib.gunzipSync(Buffer.from(invoiceDataResult.invoiceData, 'base64'), async function(err, buffer) {
      if (!err) {
          console.log('nincs hiba');
          console.log(buffer.toString());
          invoiceDataResult.invoiceData = await parseXml(buffer);
          return invoiceDataResult;
      }
      else {
        console.log(err);

      }
      //console.log(buffer);
  });
  */
  invoiceDataResult.invoiceData = await parseXml(zlib.gunzipSync(Buffer.from(invoiceDataResult.invoiceData, 'base64')));
  return invoiceDataResult;

  }
  else {
    invoiceDataResult.invoiceData = await parseXml(
      Buffer.from(invoiceDataResult.invoiceData, 'base64')
    );
    return  invoiceDataResult;
 }


};
