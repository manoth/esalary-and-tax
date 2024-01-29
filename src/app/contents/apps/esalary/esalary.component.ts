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

  public financeOffice: string;
  public financeOfficeType: string;
  public financeOfficeAll: any[];
  public adminLevel: string;
  public adminList: any[];
  public adminCid: string;
  public adminPincode: string;

  public submit: boolean = false;

  constructor(
    @Inject('ADMINTOKEN_NAME') public adminTokenName: string,
    @Inject('HOSPITALNAME') public hospitalName: string,
    @Inject('PROVINCE') public province: string,
    @Inject('OTHER') public other: string,
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
    this.financeOffice = admin.hospcode;
    this.financeOfficeType = admin.hosptype;
    this.adminLevel = admin.level;
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
                this.logoutAdmin();
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

  getFinanceOffice() {
    this.main.get('getcode/finance/office').then((res: any) => {
      this.financeOfficeAll = (res.ok) ? res.data : [];
    });
  }

  changeFinanceOffice(hospcode: string) {
    const data = this.financeOfficeAll.filter(d => d.hospcode == hospcode)[0];
    this.financeOffice = data.hospcode;
    this.financeOfficeType = data.hosptype;
  }

  modalStaff() {
    if (this.main.in_array(this.systemType, this.adminSystemType)) {
      $('#modal-staff').modal({ backdrop: 'static', keyboard: false });
    } else {
      this.logoutAdmin();
      Swal.fire({
        icon: 'error',
        title: 'เสียใจด้วย !',
        text: 'คุณไม่ใช่ผู้ดูแลระบบ',
        allowOutsideClick: false
      });
    }
  }

  getListStaff() {
    this.main.get('admin/user/list/01').then((res: any) => {
      this.adminList = (res.ok) ? res.data : [];
    });
  }

  modalAddStaff() {
    if (this.main.in_array(this.systemType, this.adminSystemType)) {
      this.getFinanceOffice();
      this.getListStaff();
      $('#modal-add-staff').modal({ backdrop: 'static', keyboard: false });
    } else {
      this.logoutAdmin();
      Swal.fire({
        icon: 'error',
        title: 'เสียใจด้วย !',
        text: 'คุณไม่ใช่ผู้ดูแลระบบ',
        allowOutsideClick: false
      });
    }
  }

  delStaff(data: any) {
    Swal.fire({
      icon: 'question',
      title: `คุณต้องการลบ!`,
      text: `ข้อมูลของ ${data.pname}${data.fname} ${data.lname} ออกจากผู้นำเข้าข้อมูลหรือไม่?`,
      showCancelButton: true,
      confirmButtonText: 'ใช่',
      cancelButtonText: 'ไม่ใช่',
      showLoaderOnConfirm: false,
      reverseButtons: true,
      allowOutsideClick: false
    }).then((result) => {
      if (!result.dismiss) {
        this.main.delete(`admin/user/systemId/01/cid/${data.cid}`, {}).then((res: any) => {
          Swal.fire({
            icon: (res.ok) ? 'success' : 'error',
            title: (res.ok) ? 'ยินดีด้วย!' : 'เกิดข้อผิดพลาด !',
            text: res.message,
            allowOutsideClick: false
          }).then(() => {
            this.getListStaff();
          });
        });
      }
    });
  }

  addStaff() {
    if (this.adminCid && this.adminPincode && this.financeOffice && this.adminPincode.length >= 6) {
      let data = {
        cid: this.adminCid, pincode: this.adminPincode,
        hospcode: this.financeOffice, hosptype: this.financeOfficeType
      }
      this.main.post('admin/user/addUpdate/01', data).then((res: any) => {
        Swal.fire({
          icon: (res.ok) ? 'success' : 'error',
          title: (res.ok) ? 'ยินดีด้วย!' : 'เกิดข้อผิดพลาด !',
          text: res.message,
          allowOutsideClick: false
        }).then(() => {
          this.getListStaff();
        });
        if (res.ok) {
          this.onFormAdd();
          this.adminCid = '';
          this.adminPincode = '';
        }
      });
    } else if (this.adminPincode && this.adminPincode.length < 6) {
      Swal.fire({
        icon: 'warning',
        title: 'เกิดข้อผิดพลาด !',
        text: 'PINCODE น้อยกว่า 6 ตัวอักษร',
        allowOutsideClick: false
      });
    } else {
      Swal.fire({
        icon: 'error',
        title: 'เกิดข้อผิดพลาด !',
        text: 'คุณกรอกข้อมูลยังไม่ครบ!',
        allowOutsideClick: false
      });
    }
  }

  onFormAdd() {
    $('#formAdd').click();
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
          this.logoutAdmin();
        }
      }
    });
  }

  logoutAdmin() {
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
    if (!data.salary_2) {
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
    } else {
      return `${(textReceipts) ? textReceipts : ''}`;
    }
  }
  titleExpenses(data: any, textExpenses: string) {
    if (!data.salary_2) {
      return (+data.positiontype <= 2) ? `1. ภาษี
      2. กบข. / กสจ. (รายเดือน)
      3. กบข.เพิ่ม (ตกเบิก)
      4. ธนาคารอาคารสงเคราะห์
      5. ค่าฌาปนกิจสงเคราะห์
      6. ธนาคารไทยพาณิชย์
      7. ค่าทุนเรือนหุ้น - เงินกู้สหกรณ์ ${(textExpenses) ? textExpenses : ''}` :
        `1. ฌกส.\n2. ประกันสังคม\n3. ประกันสังคม(ตกเบิก)\n4. สหกรณ์\n5. ธ.ออมสิน\n6. ธ.อาคารสงเคราะห์\n7. ธ.ไทยพานิชย์\n8. กยศ.\n9. ประกัน AIA\n10. ธ.อื่นๆ\n11. รายจ่ายอื่นๆ`;
    } else {
      return `${(textExpenses) ? textExpenses : ''}`;
    }
  }
  valueReceipts(data: any, numReceipts: string) {
    if (!data.salary_2) {
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
    } else {
      return `${(numReceipts) ? numReceipts : ''}`;
    }
  }
  valueExpenses(data: any, numExpenses: string) {
    if (!data.salary_2) {
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
      ${this.main.number_format(+(data.expenses_10), 2)}
      ${this.main.number_format(+(data.expenses_11), 2)}`;
    } else {
      return `${(numExpenses) ? numExpenses : ''}`;
    }
  }
  sumReceiptsAll(data: any, sumReceipts: number) {
    if (!data.salary_2) {
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
    } else {
      return (sumReceipts / 100)
    }
  }
  sumExpensesAll(data: any, sumExpenses: number) {
    if (!data.salary_2) {
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
          + (+data.expenses_10)
          + (+data.expenses_10));
    } else {
      return (sumExpenses / 100);
    }
  }

  generatePdf(data: any) {
    // Receipts
    let textReceipts: string = '';
    let numReceipts: string = '';
    let sumReceipts: number = 0;
    // Expenses
    let textExpenses: string = '';
    let toppicExpenses: number = 7;
    let numExpenses: string = '';
    let sumExpenses: number = 0;
    if (!data.salary_2) {
      let toppicReceipts: number = 10;
      for (let i = 21; i < 28; i++) {
        if (i % 2 == 1 && data['receipts_' + i] && data['receipts_' + i] != '') {
          textReceipts += '\n' + (++toppicReceipts) + '. ' + data['receipts_' + i];
          numReceipts += '\n' + (this.main.number_format(((+data['receipts_' + (i + 1)]) / 100), 2));
          sumReceipts += (+data['receipts_' + (i + 1)]);
        }
      }
      for (let i = 17; i < 32; i++) {
        if (i % 2 == 1 && data['expenses_' + i] && data['expenses_' + i] != '') {
          textExpenses += '\n' + (++toppicExpenses) + '. ' + data['expenses_' + i];
          numExpenses += '\n' + (this.main.number_format(((+data['expenses_' + (i + 1)]) / 100), 2));
          sumExpenses += (+data['expenses_' + (i + 1)]);
        }
      }
    } else {
      let toppicReceipts: number = 1;
      let arrReceipts: Array<any> = ['เงินเดือน', 'เงินเดือน(ตกเบิก)'];
      for (let i = 0; i < arrReceipts.length; i++) {
        textReceipts += ((+data['receipts_' + (i + 1)]) > 0) ? (toppicReceipts++) + '. ' + arrReceipts[i] + '\n' : '';
        numReceipts += ((+data['receipts_' + (i + 1)]) > 0) ? (this.main.number_format(((+data['receipts_' + (i + 1)]) / 100), 2)) + '\n' : '';
        sumReceipts += ((+data['receipts_' + (i + 1)]) > 0) ? (+data['receipts_' + (i + 1)]) : 0;
      }
      for (let i = 4; i < 16; i++) {
        if (((i % 5 == 4 && i < 5) || (i % 4 == 1 && i > 6)) && data['receipts_' + i] && data['receipts_' + i] != '') {
          textReceipts += (toppicReceipts++) + '. ' + (data['receipts_' + i].replace('เงินประจำตำแหน่ง', 'เงินปจต.')).split('(')[0] + '\n';
          let r = (i == 4) ? i + 2 : i + 1;
          numReceipts += (this.main.number_format(((+data['receipts_' + r]) / 100), 2)) + '\n';
          sumReceipts += (+data['receipts_' + r]);
          if (i > 6) {
            textReceipts += ((+data['receipts_' + (i + 2)]) > 0) ? (toppicReceipts++) + `. ${data['receipts_' + i]}(ตกเบิก)` + '\n' : '';
            numReceipts += ((+data['receipts_' + (i + 2)]) > 0) ? (this.main.number_format(((+data['receipts_' + (i + 2)]) / 100), 2)) + '\n' : '';
            sumReceipts += ((+data['receipts_' + (i + 2)]) > 0) ? (+data['receipts_' + (i + 2)]) : 0;
          }
        }
      }
      let toppicExpenses: number = 1;
      let arrExpenses: Array<any> = ['ภาษี', 'ภาษี(ตกเบิก)', 'กบข.', 'กบข.(ตกเบิก)', 'กบข.ส่วนเพิ่ม', 'กบข.ส่วนเพิ่ม(ตกเบิก)'];
      for (let i = 0; i < arrExpenses.length; i++) {
        textExpenses += ((+data['expenses_' + (i + 1)]) > 0) ? (toppicExpenses++) + '. ' + arrExpenses[i] + '\n' : '';
        numExpenses += ((+data['expenses_' + (i + 1)]) > 0) ? (this.main.number_format(((+data['expenses_' + (i + 1)]) / 100), 2)) + '\n' : '';
        sumExpenses += ((+data['expenses_' + (i + 1)]) > 0) ? (+data['expenses_' + (i + 1)]) : 0;
      }
      for (let i = 12; i < 70; i++) {
        if (i % 3 == 0 && data['expenses_' + i] && data['expenses_' + i] != '') {
          textExpenses += '' + (toppicExpenses++) + '. ' + data['expenses_' + i] + '\n';
          numExpenses += '' + (this.main.number_format(((+data['expenses_' + (i + 1)]) / 100), 2)) + '\n';
          sumExpenses += (+data['expenses_' + (i + 1)]);
        }
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
    let body = [[
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
      text: 'รับสุทธิ', bold: true, alignment: 'center', colSpan: 3, fillColor: '#dddddd',
    }, '', '', {
      text: this.main.number_format((sumReceiptsAll - sumExpensesAll), 2),
      bold: true, alignment: 'right', fillColor: '#dddddd',
    }]];

    let round1: any = [{
      border: [false, true, true, false],
      text: 'รับรอบที่ 1', bold: true, alignment: 'right', colSpan: 3,
    }, '', '', {
      text: this.main.number_format((+(data.salary_1) / 100), 2),
      bold: true, alignment: 'right',
    }];

    let round2: any = [{
      border: [false, false, true, false],
      text: 'รับรอบที่ 2', bold: true, alignment: 'right', colSpan: 3,
    }, '', '', {
      text: this.main.number_format(((+(data.salary_2) / 100)), 2),
      bold: true, alignment: 'right',
    }];
    if (data.salary_2) {
      body.push(round1);
      body.push(round2);
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
            { text: [{ text: `สังกัด: `, bold: true }, `${data.department || '-'}`] },
            { text: [{ text: `หน่วยงานผู้เบิก: `, bold: true }, (data.office) ? ((((data.office).split(' ')[0]).split('ชุมชน').join('')).split('ทั่วไป').join('')).split('ศูนย์').join('') : '-'] }
          ],
          margin: [15, 5, 0, 0]
        },
        {
          columns: [
            { text: [{ text: (!data.hospname) ? `จังหวัด: ` : `หน่วยงานย่อย: `, bold: true }, (!data.hospname) ? this.province : ((((data.hospname).split(' ')[0]).split('ชุมชน').join('')).split('ทั่วไป').join('')).split('ศูนย์').join('')] },
            { text: [{ text: `ชื่อ-สกุล:`, bold: true }, ` ${data.title}${data.name} ${data.lname}`] }
          ],
          margin: [15, 0, 0, 0]
        },
        {
          columns: [
            { text: [{ text: `โอนเงินเข้า: `, bold: true }, `${data.bank_name || '-'}`] },
            { text: [{ text: `เลขที่บัญชี: `, bold: true }, (data.bank_number) ? `${(data.bank_number).substring(0, 3)}-${(data.bank_number).substring(3, 4)}-${(data.bank_number).substring(4, 9)}-${(data.bank_number).substring(9, 15)}` : '-'] }
          ],
          margin: [15, 0, 0, 5]
        },
        {
          table: {
            headerRows: 1,
            widths: ['*', 'auto', '*', 'auto'],
            body: body,
          }, fontSize: 14, layout: borderTable,
        },
        {
          margin: [0, 20, 0, 0],
          text: [
            {
              text: 'หมายเหตุ : ',
              bold: true,
              style: 'textRed'
            },
            {
              text: '\n- เอกสารฉบับนี้',
            },
            {
              text: ' ไม่สามารถ ',
              style: 'textRed'
            },
            {
              text: 'นำไปเป็นหลักฐานเพื่อประกอบการทำธุรกรรม หรือใช้เป็นเอกสารอ้างอิงใดๆ ได้ทังสิ้น',
            },
            {
              text: '\nเว้นแต่ ',
              style: 'textRed'
            },
            {
              text: 'จะได้รับการรับรองจากเจ้าหน้าที่การเงินของหน่วยงาน เท่านั้น',
            },
            {
              text: '\n- กรุณาตรวจสอบยอดเงินที่เข้าบัญชีกับธนาคารทุกครั้ง กรณีมีข้อสงสัยกรุณาติดต่อ 044-518402-5 ต่อ 103',
            },
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
      styles: {
        textRed: {
          color: 'red',
        }
      },
      defaultStyle: {
        font: 'THSarabunNew',
        fontSize: 16,
        columnGap: 0
      }
    };
  }

}
