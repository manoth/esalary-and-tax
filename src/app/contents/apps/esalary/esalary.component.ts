import { Component, OnInit, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MainService, CryptoService, ImagesService } from 'src/app/services';

import Swal from 'sweetalert2';

import pdfMake from 'pdfmake/build/pdfmake';
import pdfFonts from 'pdfmake/build/vfs_fonts';
pdfMake.vfs = pdfFonts.pdfMake.vfs;
pdfMake.fonts = {
  THSarabunNew: {
    normal: 'THSarabunNew.ttf',
    bold: 'THSarabunNew-Bold.ttf',
    italics: 'THSarabunNew-Italic.ttf',
    bolditalics: 'THSarabunNew-BoldItalic.ttf'
  },
  Roboto: {
    normal: 'Roboto-Regular.ttf',
    bold: 'Roboto-Medium.ttf',
    italics: 'Roboto-Italic.ttf',
    bolditalics: 'Roboto-MediumItalic.ttf'
  }
}

declare const $: any;

@Component({
  selector: 'app-esalary',
  templateUrl: './esalary.component.html',
  styleUrls: ['./esalary.component.scss']
})
export class EsalaryComponent implements OnInit {

  public adminPage: boolean = false;
  public systemType: string = '01';
  public adminSystemType: Array<string>;

  public uploading: boolean = false;

  public decode: any;
  // public pincode: string;
  public positiontype: string;
  public myfile: any;
  public hasMyfile: boolean = false;
  public txtMyfileError: string;
  public hasRadio: boolean = false;

  public getPdf: boolean = false;
  public pdfFile: any;
  public data: any;

  public loading: boolean = true;
  public cid: string;
  public year: string;
  public arrYear: any;
  public month: string;
  public arrMonth: any;

  public submit: boolean = false;

  constructor(
    @Inject('ADMINTOKEN_NAME') public adminTokenName: string,
    public router: Router,
    public route: ActivatedRoute,
    public main: MainService,
    public crypto: CryptoService,
    public images: ImagesService
  ) {
    this.main.jwtDecode.then((decode: any) => {
      this.decode = decode;
    });
  }

  ngOnInit() {
    this.getYear(this.cid);
    this.route.queryParams.subscribe((queryParams) => {
      this.getPdf = (queryParams['pdf'] && this.submit) ? true : false;
    });
  }

  getYear(cid: string) {
    let admin = this.main.jwtDecodeAdmin(sessionStorage.getItem(this.adminTokenName));
    this.adminSystemType = (admin) ? admin.systemTypeAll : [];
    this.adminPage = (admin && this.main.in_array(this.systemType, this.adminSystemType)) ? true : false;
    this.main.post('esalary/year', { cid: (cid) ? this.crypto.md5(cid) : false }).then((res: any) => {
      this.arrYear = (!res.ok) || res.data;
      this.year = (!res.ok) || res.data[0].year;
      this.getMonth(this.year, cid);
    });
  }

  getMonth(year: any, cid: string) {
    this.main.post('esalary/month/' + year, { cid: (cid) ? this.crypto.md5(cid) : false }).then((res: any) => {
      this.arrMonth = (!res.ok) || res.data;
      this.month = (!res.ok) || res.data[0].month;
      this.loading = false;
    });
  }

  onYear(year: string) {
    this.getMonth(year, this.cid);
  }

  onRadio() {
    this.hasRadio = false;
  }

  fileProgress(files: any) {
    if (files.length > 0) {
      const mimeType = files[0].type;
      if (mimeType.match(/text\/*/) != null || mimeType == 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
        this.myfile = files[0];
        this.hasMyfile = false;
      } else {
        this.hasMyfile = true;
        return;
      }
    }
  }

  onUpload() {
    if (+this.positiontype > 0) {
      this.hasMyfile = true;
      if (this.myfile) {
        const formData: FormData = new FormData();
        formData.append('myfile', this.myfile);
        formData.append('positiontype', this.positiontype);
        this.uploading = true;
        this.main.post(`esalary/uploadfile?token=${sessionStorage.getItem(this.adminTokenName)}`, formData).then((res: any) => {
          this.uploading = false;
          this.hasMyfile = !res.ok;
          this.txtMyfileError = res.txt;
          // console.log(res);
          if (res.ok) {
            Swal.fire({
              icon: 'success',
              title: 'ยินดีด้วย !',
              text: res.txt,
              allowOutsideClick: false
            }).then(() => {
              $('#modal-staff').modal('hide');
            });
          } else {
            Swal.fire({
              icon: 'error',
              title: 'เสียใจด้วย !',
              text: res.txt,
              allowOutsideClick: false
            }).then(() => {
              if (res.pincode) {
                $('#modal-staff').modal('hide');
                this.logout();
              }
            });
          }
        });
      }
    } else {
      this.hasRadio = true;
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด !',
        text: 'กรุณาเลือกประเภทการนำเข้าฐานข้อมูลด้วย.',
        allowOutsideClick: false
      });
    }
  }

  staff() {
    this.hasRadio = false;
    this.hasMyfile = false;
    this.positiontype = '';
    Swal.fire({
      title: 'กรุณาใส่ PINCODE สำหรับเจ้าหน้าที่',
      input: 'password',
      showCancelButton: true,
      confirmButtonText: 'ตกลง',
      cancelButtonText: 'ยกเลิก',
      showLoaderOnConfirm: false,
      reverseButtons: true,
      allowOutsideClick: false
    }).then((result) => {
      if (!result.dismiss) {
        this.main.post(`admin/pincode/${this.crypto.md5(result.value)}`, {}).then((res: any) => {
          if (res.ok) {
            let admin = this.main.jwtDecodeAdmin(res.token);
            this.adminSystemType = (admin) ? admin.systemTypeAll : [];
            this.adminPage = (admin && this.main.in_array(this.systemType, this.adminSystemType)) ? true : false;
            if (this.main.in_array(this.systemType, this.adminSystemType)) {
              sessionStorage.setItem(this.adminTokenName, res.token);
              this.ngOnInit();
            } else {
              Swal.fire({
                icon: 'error',
                title: 'เสียใจด้วย !',
                text: res.message,
                allowOutsideClick: false
              });
            }
          } else {
            Swal.fire({
              icon: 'error',
              title: 'เสียใจด้วย !',
              text: res.message,
              allowOutsideClick: false
            });
          }
        });
      }
    });
  }

  modalStaff() {
    if (this.main.in_array(this.systemType, this.adminSystemType)) {
      $('#modal-staff').modal({ backdrop: 'static', keyboard: false });
    } else {
      this.logout();
      Swal.fire({
        icon: 'error',
        title: 'เสียใจด้วย !',
        text: 'คุณไม่ใช่ผู้ดูแลระบบ',
        allowOutsideClick: false
      });
    }
  }

  onSubmit() {
    this.submit = true;
    this.loading = true;
    let date = { year: this.year, month: this.month, cid: (this.cid) ? this.crypto.md5(this.cid) : null }
    let url = (this.adminPage) ? `esalary?token=${sessionStorage.getItem(this.adminTokenName)}` : `esalary`;
    this.main.post(url, date).then((res: any) => {
      this.loading = false;
      this.data = res.data;
      if (res.ok) {
        pdfMake.createPdf(this.generatePdf(res.data)).getBlob((dataUrl: any) => {
          let file = new Blob([dataUrl], { type: 'application/pdf' });
          this.pdfFile = URL.createObjectURL(file);
          this.getPdf = true;
          this.router.navigate(['/apps/esalary'], { queryParams: { pdf: 'on' } });
        });
      } else {
        this.router.navigate(['/apps/esalary']);
        Swal.fire({
          icon: 'error',
          title: 'เกิดข้อผิดพลาด !',
          text: res.err,
          allowOutsideClick: false
        });
        if (res.pincode) {
          this.logout();
        }
      }
    });
  }

  logout() {
    sessionStorage.removeItem(this.adminTokenName);
    this.adminSystemType = [];
    this.cid = null;
    this.getYear(this.cid);
  }

  onReset() {
    this.getYear(this.cid);
  }

  onPrint() {
    pdfMake.createPdf(this.generatePdf(this.data)).print();
  }

  onDownload() {
    pdfMake.createPdf(this.generatePdf(this.data)).download('ใบรับรองการจ่ายเงินเดือนและเงินอื่น.pdf');
  }

  onBack() {
    this.getPdf = false;
    this.router.navigate(['/apps/esalary']);
  }

  toNumber(month: string) {
    return Number(month);
  }

  titleReceipts(data: any, textReceipts: string) {
    // console.log(data);
    return (+data.positiontype <= 2) ? `1. เงินเดือน
      2. เงินเดือน(ตกเบิก)
      3. เงินปจต. / วิชาชีพ / วิทยฐานะ
      4. เงินปจต. / วิชาชีพ / วิทยฐานะ(ตกเบิก)
      5. เงิน พ.ส.ร. / พ.ต.ก.
      6. เงินเท่าประจำตำแหน่ง
      7. เงินเท่าประจำตำแหน่ง(ตกเบิก)
      8. เงินค่าตอบแทนรายเดือน ต.ข.8 - 8ว.
      9. เงินค่าตอบแทนรายเดือน ต.ข.8-8ว.(ตกเบิก)
      10. เงินค่าตอบแทนพิเศษ ว.319 / ตกเบิก ${(textReceipts) ? textReceipts : ''}` :
      `1. เงินเดือน\n2. ค่าครองชีพ\n3. ตกเบิกเงินเดือน\n4. ตกเบิกค่าครองชีพ\n 5. รายรับอื่นๆ`;
  }
  titleExpenses(data: any, textExpenses: string) {
    return (+data.positiontype <= 2) ? `1. ภาษี
      2. กบข. / กสจ. (รายเดือน)
      3. กบข.เพิ่ม (ตกเบิก)
      4. ธนาคารอาคารสงเคราะห์
      5. ค่าฌาปนกิจสงเคราะห์
      6. ธนาคารไทยพาณิชย์
      7. ค่าทุนเรือนหุ้น - เงินกู้สหกรณ์ ${(textExpenses) ? textExpenses : ''}` :
      `1. ฌกส.\n2. ประกันสังคม\n3. ประกันสังคม(ตกเบิก)\n4. สหกรณ์\n5. ธ.ออมสิน\n6. ธ.อาคารสงเคราะห์\n7. ธ.ไทยพานิชย์\n8. กยศ.\n9. ธ.อื่นๆ\n10 รายจ่ายอื่นๆ`;
  }
  valueReceipts(data: any, numReceipts: string) {
    return (+data.positiontype <= 2) ? `${this.main.number_format((+(data.receipts_1) / 100), 2)}
      ${this.main.number_format((+(data.receipts_2) / 100), 2)}
      ${this.main.number_format((+(data.receipts_3) / 100), 2)}
      ${this.main.number_format((+(data.receipts_4) / 100), 2)}
      ${this.main.number_format((+(data.receipts_6) / 100), 2)}
      ${this.main.number_format((+(data.receipts_11) / 100), 2)}
      ${this.main.number_format((+(data.receipts_12) / 100), 2)}
      ${this.main.number_format((+(data.receipts_13) / 100), 2)}
      ${this.main.number_format((+(data.receipts_14) / 100), 2)}
      ${this.main.number_format((+(data.receipts_16) / 100), 2)} ${(numReceipts) ? numReceipts : ''}` :
      `${this.main.number_format(+(data.receipts_1), 2)}
      ${this.main.number_format(+(data.receipts_2), 2)}
      ${this.main.number_format(+(data.receipts_3), 2)}
      ${this.main.number_format(+(data.receipts_4), 2)}
      ${this.main.number_format(+(data.receipts_5), 2)}`;
  }
  valueExpenses(data: any, numExpenses: string) {
    return (+data.positiontype <= 2) ? `${this.main.number_format((+(data.expenses_1) / 100), 2)}
      ${this.main.number_format((+(data.expenses_5) / 100), 2)}
      ${this.main.number_format((+(data.expenses_6) / 100), 2)}
      ${this.main.number_format((+(data.expenses_7) / 100), 2)}
      ${this.main.number_format((+(data.expenses_15) / 100), 2)}
      ${this.main.number_format((+(data.expenses_9) / 100), 2)}
      ${this.main.number_format((+(data.expenses_3) / 100), 2)} ${(numExpenses) ? numExpenses : ''}` :
      `${this.main.number_format(+(data.expenses_1), 2)}
      ${this.main.number_format(+(data.expenses_2), 2)}
      ${this.main.number_format(+(data.expenses_3), 2)}
      ${this.main.number_format(+(data.expenses_4), 2)}
      ${this.main.number_format(+(data.expenses_5), 2)}
      ${this.main.number_format(+(data.expenses_6), 2)}
      ${this.main.number_format(+(data.expenses_7), 2)}
      ${this.main.number_format(+(data.expenses_8), 2)}
      ${this.main.number_format(+(data.expenses_9), 2)}
      ${this.main.number_format(+(data.expenses_10), 2)}`;
  }
  sumReceiptsAll(data: any, sumReceipts: number) {
    return (+data.positiontype <= 2) ?
      (((+data.receipts_1)
        + (+data.receipts_2)
        + (+data.receipts_3)
        + (+data.receipts_4)
        + (+data.receipts_6)
        + (+data.receipts_11)
        + (+data.receipts_12)
        + (+data.receipts_13)
        + (+data.receipts_14)
        + (+data.receipts_16)
        + sumReceipts) / 100) :
      ((+data.receipts_1)
        + (+data.receipts_2)
        + (+data.receipts_3)
        + (+data.receipts_4)
        + (+data.receipts_5));
  }
  sumExpensesAll(data: any, sumExpenses: number) {
    return (+data.positiontype <= 2) ?
      (((+data.expenses_1)
        + (+data.expenses_5)
        + (+data.expenses_6)
        + (+data.expenses_7)
        + (+data.expenses_15)
        + (+data.expenses_3)
        + (+data.expenses_9)
        + sumExpenses) / 100) :
      ((+data.expenses_1)
        + (+data.expenses_2)
        + (+data.expenses_3)
        + (+data.expenses_4)
        + (+data.expenses_5)
        + (+data.expenses_6)
        + (+data.expenses_7)
        + (+data.expenses_8)
        + (+data.expenses_9)
        + (+data.expenses_10));
  }

  generatePdf(data: any) {
    let textReceipts: string = '';
    let toppicReceipts: number = 10;
    let numReceipts: string = '';
    let sumReceipts: number = 0;
    for (let i = 21; i < 28; i++) {
      if (i % 2 == 1 && data['receipts_' + i] && data['receipts_' + i] != '') {
        textReceipts += '\n' + (++toppicReceipts) + '. ' + data['receipts_' + i];
        numReceipts += '\n' + (this.main.number_format(((+data['receipts_' + (i + 1)]) / 100), 2));
        sumReceipts += (+data['receipts_' + (i + 1)]);
      }
    }
    let textExpenses: string = '';
    let toppicExpenses: number = 7;
    let numExpenses: string = '';
    let sumExpenses: number = 0;
    for (let i = 17; i < 32; i++) {
      if (i % 2 == 1 && data['expenses_' + i] && data['expenses_' + i] != '') {
        textExpenses += '\n' + (++toppicExpenses) + '. ' + data['expenses_' + i];
        numExpenses += '\n' + (this.main.number_format(((+data['expenses_' + (i + 1)]) / 100), 2));
        sumExpenses += (+data['expenses_' + (i + 1)]);
      }
    }
    let titleReceipts = this.titleReceipts(data, textReceipts);
    let valueReceipts = this.valueReceipts(data, numReceipts);
    let titleExpenses = this.titleExpenses(data, textExpenses);
    let valueExpenses = this.valueExpenses(data, numExpenses);
    let sumReceiptsAll = this.sumReceiptsAll(data, sumReceipts);
    let sumExpensesAll = this.sumExpensesAll(data, sumExpenses);
    let borderTable = {
      hLineWidth: (i, node) => {
        return 0.4;
      },
      vLineWidth: (i, node) => {
        return 0.4;
      }
    }
    return {
      pageSize: 'A4',
      // pageMargins: [30, 30, 30, 30],
      // watermark: { text: 'สำนักงานสาธารณสุขจังหวัดชัยภูมิ', color: 'red', opacity: 0.3, bold: true, italics: true },
      background: (currentPage, pageSize) => {
        return { image: 'logoMoph', width: 500, opacity: 0.06, absolutePosition: { x: 50, y: 185 } }
      },
      images: {
        logoMoph: this.images.logoMoph
      },
      content: [
        {
          image: 'logoMoph',
          width: 80,
          alignment: 'center'
        },
        {
          text: 'ใบรับรองการจ่ายเงินเดือนและเงินอื่นๆ',
          bold: true,
          fontSize: 28,
          alignment: 'center',
          margin: [0, 0, 0, 0]
        },
        {
          text: 'สำนักงานสาธารณสุขจังหวัดชัยภูมิ',
          fontSize: 18,
          alignment: 'center'
        },
        {
          text: (data.positiontype == '1') ? 'ข้าราชการพลเรือน' : (data.positiontype == '2') ? 'ลูกจ้างประจำ' : 'พนักงานราชการทั่วไป',
          fontSize: 18,
          alignment: 'center'
        },
        {
          text: `ประจำเดือน ${this.main.arrMonthTxt[+this.month - 1]} พ.ศ. ${this.year}`,
          fontSize: 18,
          alignment: 'center'
        },
        {
          columns: [
            { text: [{ text: `ชื่อ-สกุล :`, bold: true }, ` ${data.title}${data.name} ${data.lname}`] },
            { text: [{ text: `หน่วยงานผู้เบิก :`, bold: true }, ` ${data.office || '-'}`] }
          ],
          margin: [30, 5, 0, 0]
        },
        {
          columns: [
            { text: [{ text: `จังหวัด :`, bold: true }, ` ชัยภูมิ`] },
            { text: [{ text: `สังกัด :`, bold: true }, ` ${data.department || '-'}`] }
          ],
          margin: [30, 0, 0, 0]
        },
        {
          columns: [
            { text: [{ text: `โอนเงินเข้า :`, bold: true }, ` ${data.bank_name || '-'}`] },
            { text: [{ text: `เลขที่บัญชี :`, bold: true }, ` ${data.bank_number || '-'}`] }
          ],
          margin: [30, 0, 0, 5]
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', '*', 'auto'],
            body: [
              [
                { text: 'รายรับ', bold: true, alignment: 'center', fillColor: '#cccccc', },
                { text: 'จำนวนเงิน(บาท)', bold: true, alignment: 'center', fillColor: '#cccccc', },
                { text: 'รายจ่าย', bold: true, alignment: 'center', fillColor: '#cccccc', },
                { text: 'จำนวนเงิน(บาท)', bold: true, alignment: 'center', fillColor: '#cccccc', }
              ],
              [{
                text: titleReceipts
              }, {
                text: valueReceipts,
                alignment: 'right'
              },
              {
                text: titleExpenses
              }, {
                text: valueExpenses,
                alignment: 'right'
              }],
              [
                { text: 'รวมรายรับ', bold: true, alignment: 'center' },
                {
                  text: this.main.number_format(sumReceiptsAll, 2),
                  bold: true, alignment: 'right'
                },
                { text: 'รวมรายจ่าย', bold: true, alignment: 'center' },
                {
                  text: this.main.number_format(sumExpensesAll, 2),
                  bold: true, alignment: 'right'
                }
              ],
              [{
                text: 'รับสุทธ', bold: true, alignment: 'center', colSpan: 3, fillColor: '#dddddd',
              }, '', '', {
                text: this.main.number_format((sumReceiptsAll - sumExpensesAll), 2),
                bold: true, alignment: 'right', fillColor: '#dddddd',
              }]
            ]
          }, fontSize: 14, layout: borderTable,
        },
        {
          margin: [0, 20, 0, 0],
          text: [
            {
              text: 'หมายเหตุ : ',
              bold: true
            },
            ` เอกสารฉบับนี้ไม่สามารถนำไปเป็นหลักฐานเพื่อประกอบการทำธุรกรรม หรือใช้เป็นเอกสารอ้างอิงใดๆ ได้ทั้งสิ้น เว้นแต่จะได้รับการรับรองจากเจ้าหน้าที่การเงิน สำนักงานสาธารณสุขจังหวัดชัยภูมิ เท่านั้น!`,
          ]
        },
        {
          text: [
            {
              text: `พิมพ์วันที่ ${this.main.thaiDate(new Date(), 'medium')} `,
              bold: true,
            },
          ],
          alignment: 'right',
          absolutePosition: { x: 0, y: 700 }
        }
      ],
      defaultStyle: {
        font: 'THSarabunNew',
        fontSize: 16,
        columnGap: 0
      }
    };
  }

}
