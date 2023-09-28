import { Component, OnInit, Inject } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { MainService, CryptoService } from 'src/app/services';

import { ThaiBaht } from 'thai-baht-text-ts';
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
  selector: 'app-tax',
  templateUrl: './tax.component.html',
  styleUrls: ['./tax.component.scss']
})
export class TaxComponent implements OnInit {

  public adminPage: boolean = false;
  public systemType: string = '01';
  public adminSystemType: Array<string>;

  public loading: boolean = true;
  public getPdf: boolean = false;
  public uploading: boolean = false;
  public hasMyfile: boolean = false;
  public txtMyfileError: string;

  public decode: any;
  // public pincode: string;
  public myfile: any;
  public pdfFile: any;
  public arrYear: any;
  public cid: string;
  public year: string;
  public data: any;
  public data2: any;
  public arrAddress: any;
  public address: string = '';
  public disableAddress: boolean = false;

  public submit: boolean = false;

  constructor(
    @Inject('ADMINTOKEN_NAME') private adminTokenName: string,
    public router: Router,
    public route: ActivatedRoute,
    public main: MainService,
    public crypto: CryptoService
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
    this.address = (!cid) ? this.address : '';
    this.disableAddress = (cid) ? true : false;
    let admin = this.main.jwtDecodeAdmin(sessionStorage.getItem(this.adminTokenName));
    this.adminSystemType = (admin) ? admin.systemTypeAll : [];
    this.adminPage = (admin && this.main.in_array(this.systemType, this.adminSystemType)) ? true : false;
    this.main.post('tax/year', { cid: (cid) ? this.crypto.md5(cid) : false }).then((res: any) => {
      this.arrYear = (!res.ok) || res.data;
      this.year = (!res.ok) || res.data[0].year;
      (this.adminPage) ? this.getAddress(this.year) : null;
      this.loading = false;
    });
  }

  getAddress(year: string) {
    this.address = '';
    this.main.get(`tax/address/year/${year}?token=${sessionStorage.getItem(this.adminTokenName)}`).then((res: any) => {
      this.arrAddress = (res.ok) ? res.data : [];
    });
  }

  staff() {
    this.hasMyfile = false;
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

  fileProgress(files: any) {
    if (files.length > 0) {
      const mimeType = files[0].type;
      if (mimeType.match(/text\/*/) != null) {
        this.myfile = files[0];
        this.hasMyfile = false;
      } else {
        this.hasMyfile = true;
        return;
      }
    }
  }

  onUpload() {
    this.hasMyfile = true;
    if (this.myfile) {
      const formData: FormData = new FormData();
      formData.append('myfile', this.myfile);
      this.uploading = true;
      this.main.post(`tax/uploadfile?token=${sessionStorage.getItem(this.adminTokenName)}`, formData).then((res: any) => {
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
          })
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
  }

  onSubmit() {
    this.submit = true;
    this.loading = true;
    let data = { year: this.year, address: this.address, cid: (this.cid) ? this.crypto.md5(this.cid) : null }
    let url = (this.adminPage) ? `tax?token=${sessionStorage.getItem(this.adminTokenName)}` : `tax`;
    url = (this.address) ? `tax/address?token=${sessionStorage.getItem(this.adminTokenName)}` : url;
    this.main.post(url, data).then((res: any) => {
      this.loading = false;
      this.data = res.data;
      this.data2 = res.data2;
      if (res.ok) {
        pdfMake.createPdf(this.generatePdf(res.data, res.data2)).getBlob((dataUrl: any) => {
          let file = new Blob([dataUrl], { type: 'application/pdf' });
          this.pdfFile = URL.createObjectURL(file);
          this.getPdf = true;
          this.router.navigate(['/apps/tax'], { queryParams: { pdf: 'on' } });
        });
      } else {
        this.router.navigate(['/apps/tax']);
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
    pdfMake.createPdf(this.generatePdf(this.data, this.data2)).print();
  }

  onDownload() {
    pdfMake.createPdf(this.generatePdf(this.data, this.data2)).download('หนังสือรับรองการหักภาษี ณ ที่จ่าย.pdf');
  }

  onBack() {
    this.getPdf = false;
    this.router.navigate(['/apps/tax']);
  }

  format_cid(cid: string) {
    if (cid) {
      let id = (cid.length != 13) ? ('000000000000' + cid).substr(-13, 13) : cid;
      return `${id.substr(0, 1)}-${id.substr(1, 4)}-${id.substr(5, 5)}-${id.substr(10, 2)}-${id.substr(12, 1)}`;
    } else {
      return;
    }
  }

  taxPdf2Address(data2: Array<any>, borderTable: any) {
    let content = [];
    for (let i = 0; i < data2.length; i++) {
      content.push(this.taxPdf2(data2[i], borderTable, (i > 0) ? 'before' : ''));
    }
    return content;
  }

  generatePdf(data_1: any, data_2: any) {
    let data1 = data_1;
    let data2 = data_2;
    let borderTable = {
      hLineWidth: (i, node) => {
        return 0.3;
      },
      vLineWidth: (i, node) => {
        return 0.3;
      }
    }
    let content;
    if (Array.isArray(data_2)) {
      content = this.taxPdf2Address(data_2, borderTable);
    } else {
      content = [
        // Tax PDF Page 1 after
        (data1) ? this.taxPdf1(data1, borderTable) : null,
        // Tax PDF Page 2 before
        (data2) ? this.taxPdf2(data2, borderTable, (data1 && data2) ? 'before' : '') : null
      ]
    }
    return {
      pageSize: 'A4',
      pageMargins: [25, 25, 25, 0],
      pageOrientation: 'portrait',
      content: content,
      defaultStyle: {
        font: 'THSarabunNew',
        fontSize: 14,
        columnGap: 0
      }
    };

  }

  taxPdf1(data, borderTable) {
    let type = (type) => {
      let xy;
      switch (+type) {
        case 1: xy = { x: 250, y: 302 }; break;
        case 2: xy = { x: 330, y: 302 }; break;
        case 3: xy = { x: 430, y: 302 }; break;
        case 4: xy = { x: 505, y: 302 }; break;
        case 5: xy = { x: 250, y: 328 }; break;
        case 6: xy = { x: 330, y: 328 }; break;
        case 7: xy = { x: 430, y: 328 }; break;
        default: xy = { x: 330, y: 302 };
      }
      return xy;
    }
    let reserve = (reserve) => {
      let xy;
      switch (+reserve) {
        case 1: xy = { x: 147, y: 618 }; break;
        case 2: xy = { x: 380, y: 618 }; break;
        default: xy = { x: 147, y: 618 };
      }
      return xy;
    }
    let reserve_baht = (reserve) => {
      let xy;
      switch (+reserve) {
        case 1: xy = { x: 205, y: 620 }; break;
        case 2: xy = { x: 440, y: 620 }; break;
        default: xy = { x: 205, y: 620 };
      }
      return xy;
    }
    let dispenser = (dispenser) => {
      let xy;
      switch (+dispenser) {
        case 1: xy = { x: 102, y: 656 }; break;
        case 2: xy = { x: 211, y: 656 }; break;
        case 3: xy = { x: 321, y: 656 }; break;
        default: xy = { x: 431, y: 656 };
      }
      return xy;
    }
    return [{
      image: 'data:image/png;base64,' + data.signature,
      width: 100,
      absolutePosition: { x: 370, y: 706 }
    },
    {
      text: 'ฉบับที่ 1 (สำหรับผู้ถูกหักภาษี ณ ที่จ่าย ใช้แนบพร้อมกับแบบแสดงรายการภาษี)\nฉบับที่ 2 (สำหรับผู้ถูกหักภาษี ณ ที่จ่าย เก็บไว้เป็นหลักฐาน)',
      fontSize: 11,
      margin: [15, 0, 0, 10]
    }, {
      table: {
        widths: ['*'],
        body: [
          [[{
            text: ['หนังสือรับรองการหักภาษี ณ ที่จ่าย\n', { text: 'ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร\n', fontSize: 12 }],
            margin: [0, 5, 0, 0], alignment: 'center'
          },
          { text: 'เล่มที่ ...........................\nเลขที่ ...........................', fontSize: 13, absolutePosition: { x: 486, y: 72 } },
          { text: `${data.id}`, absolutePosition: { x: 516, y: 86 } },
          {
            margin: [5, 2, 5, 0],
            table: {
              widths: ['*'],
              body: [[[
                { text: 'ผู้มีหน้าที่หักภาษี ณ ที่จ่าย :-', margin: [0, 0, 0, 5] },
                {
                  text: 'ชื่อ    ..................................................................................................',
                  margin: [5, 0, 0, 10]
                }, {
                  text: 'ที่อยู่  ......................................................................................................................................................................................................................',
                  margin: [5, 5, 0, 15]
                }, [
                  { text: 'เลขประจำตัวประชาชน', fontSize: 12, absolutePosition: { x: 305, y: 111 } },
                  { text: 'เลขประจำตัวผู้เสียภาษีอากร', fontSize: 12, absolutePosition: { x: 320, y: 131 } },
                  { text: '( ให้ระบุว่าเป็น บุคคล นิติบุคคล บริษัท สมาคม หรือคณะบุคคล )', fontSize: 11, absolutePosition: { x: 70, y: 144 } },
                  { text: '( กรอกเฉพาะกรณีเป็นผู้ไม่มีเลขบัตรประจำตัวประชาชน )', fontSize: 11, absolutePosition: { x: 382, y: 144 } },
                  { text: '( ให้ระบุ ชื่ออาคาร/หมู่บ้าน ห้องเลขที่ ชั้นที่ เลขที่ ตรอก/ซอย หมู่ที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด )', fontSize: 11, absolutePosition: { x: 70, y: 178 } },
                  { text: `${this.format_cid(data.department_id)}`, absolutePosition: { x: 400, y: 108 } },
                  { text: '', absolutePosition: { x: 430, y: 127 } },
                  { text: `${data.department}`, absolutePosition: { x: 70, y: 127 } },
                  { text: `${data.department_address}`, absolutePosition: { x: 70, y: 161 } },
                ]
              ]]]
            }, layout: borderTable,
          }, {
            margin: [5, 8, 5, 8],
            table: {
              widths: ['*'],
              body: [[[
                { text: 'ผู้ถูกหักภาษี ณ ที่จ่าย :-', margin: [0, 0, 0, 5] },
                {
                  text: 'ชื่อ    ..................................................................................................',
                  margin: [5, 0, 0, 10]
                }, {
                  text: 'ที่อยู่  ......................................................................................................................................................................................................................',
                  margin: [5, 5, 0, 18]
                }, {
                  margin: [5, 5, 0, 5], fontSize: 12,
                  text: `ลำดับที่                               ในแบบ`,
                }, {
                  margin: [5, 0, 0, 15], fontSize: 11,
                  text: '(ให้สามารถอ้างอิงหรือสอบอันดับได้ระหว่างลำดับที\nตามหนังสือรับรองฯกับแบบยื่นรายการภาษีหักจ่าย)',
                }, [
                  { text: 'เลขประจำตัวประชาชน', fontSize: 12, absolutePosition: { x: 305, y: 213 } },
                  { text: 'เลขประจำตัวผู้เสียภาษีอากร', fontSize: 12, absolutePosition: { x: 320, y: 233 } },
                  { text: '( ให้ระบุว่าเป็น บุคคล นิติบุคคล บริษัท สมาคม หรือคณะบุคคล )', fontSize: 11, absolutePosition: { x: 70, y: 246 } },
                  { text: '( กรอกเฉพาะกรณีเป็นผู้ไม่มีเลขบัตรประจำตัวประชาชน )', fontSize: 11, absolutePosition: { x: 382, y: 246 } },
                  { text: '( ให้ระบุ ชื่ออาคาร/หมู่บ้าน ห้องเลขที่ ชั้นที่ เลขที่ ตรอก/ซอย หมู่ที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด )', fontSize: 11, absolutePosition: { x: 70, y: 280 } },
                  { text: `${this.format_cid(data.cid)}`, absolutePosition: { x: 400, y: 210 } },
                  { text: `${(!data.cid) ? this.format_cid(data.tax_id) : ''}`, absolutePosition: { x: 430, y: 229 } },
                  { text: `${data.name}`, absolutePosition: { x: 70, y: 229 } },
                  { text: `${data.address}`, absolutePosition: { x: 70, y: 263 } },
                  //=>
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 70, h: 20, lineWidth: 0.3 }], absolutePosition: { x: 72, y: 303 } },
                  { text: `${data.no}`, absolutePosition: { x: 92, y: 305 } },
                  //=>
                  { text: '(1) ภ.ง.ด.1ก', fontSize: 12, absolutePosition: { x: 266, y: 305 } },
                  { text: '(2) ภ.ง.ด.1ก พิเศษ', fontSize: 12, absolutePosition: { x: 346, y: 305 } },
                  { text: '(3) ภ.ง.ด.2', fontSize: 12, absolutePosition: { x: 446, y: 305 } },
                  { text: '(4) ภ.ง.ด.3', fontSize: 12, absolutePosition: { x: 521, y: 305 } },
                  { text: '(5) ภ.ง.ด.2ก', fontSize: 12, absolutePosition: { x: 266, y: 331 } },
                  { text: '(6) ภ.ง.ด.3ก', fontSize: 12, absolutePosition: { x: 346, y: 331 } },
                  { text: '(7) ภ.ง.ด.53', fontSize: 12, absolutePosition: { x: 446, y: 331 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 245, y: 303 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 325, y: 303 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 425, y: 303 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 500, y: 303 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 245, y: 329 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 325, y: 329 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 425, y: 329 } },
                  { text: 'X', fontSize: 16, absolutePosition: type(data.type) },
                  //==>
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 142, y: 619 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 375, y: 619 } },
                  { text: 'X', fontSize: 16, absolutePosition: reserve(data.reserve) },
                  { text: `${this.main.number_format(data.reserve_baht / 100, 2)}`, absolutePosition: reserve_baht(data.reserve) },
                  //====>
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 97, y: 657 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 206, y: 657 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 316, y: 657 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 426, y: 657 } },
                  { text: 'X', fontSize: 16, absolutePosition: dispenser(data.dispenser) },
                ]
              ]]]
            }, layout: borderTable,
          }, {
            margin: [5, 0, 5, 8],
            table: {
              headerRows: 1,
              widths: ['*', '*', 65, 50, 11, 50, 11],
              body: [[
                { text: 'ประเภทเงินได้พึงประเมินจ่าย', fontSize: 12, alignment: 'center', colSpan: 2, margin: [0, 10, 0, 0] }, '',
                { text: 'วัน เดือน \nหรือปีภาษี ที่จ่าย', fontSize: 12, alignment: 'center', margin: [0, 2, 0, 0] },
                { text: 'จำนวนเงินที่จ่าย ', fontSize: 12, alignment: 'center', colSpan: 2, margin: [0, 10, 0, 0] }, '',
                { text: 'ภาษีที่หัก \nและนำส่งไว้', fontSize: 12, alignment: 'center', colSpan: 2, margin: [0, 2, 0, 0] }, '',
              ], [
                {
                  text: '1. เงินเดือน ค่าจ้าง เบี้ยเลี้ยงโบนัส ฯลฯ ตามมาตรา 40(1)\n2. ค่าธรรมเนียม ค่านายหน้า ฯลฯ ตามมาตรา 40(2)',
                  margin: [5, 2, 0, 90], colSpan: 2, fontSize: 12,
                }, '',
                { text: `${data.year}`, alignment: 'center' },
                { text: `${this.main.number_format(data.expenses_1 / 100, 2).split('.')[0]}`, alignment: 'right' },
                { text: `${this.main.number_format(data.expenses_1 / 100, 2).split('.')[1]}`, alignment: 'right' },
                { text: `${this.main.number_format(data.tax_1 / 100, 2).split('.')[0]}`, alignment: 'right' },
                { text: `${this.main.number_format(data.tax_1 / 100, 2).split('.')[1]}`, alignment: 'right' },
              ], [
                {
                  border: [true, true, true, false],
                  text: 'รวมเงินที่จ่ายและภาษีที่หักนำส่ง', fontSize: 12,
                  margin: [0, 2, 30, 0], colSpan: 3, alignment: 'right'
                }, '', '',
                { text: `${this.main.number_format(data.expenses_sum / 100, 2).split('.')[0]}`, alignment: 'right' },
                { text: `${this.main.number_format(data.expenses_sum / 100, 2).split('.')[1]}`, alignment: 'right' },
                { text: `${this.main.number_format(data.tax_sum / 100, 2).split('.')[0]}`, alignment: 'right' },
                { text: `${this.main.number_format(data.tax_sum / 100, 2).split('.')[1]}`, alignment: 'right' },
              ], [
                {
                  border: [true, false, false, true],
                  text: 'รวมเงินภาษีที่หักนำส่ง (ตัวอักษร)', fontSize: 12,
                  margin: [10, 10, 0, 0]
                }, {
                  border: [false, false, true, true],
                  text: `${data.tax_thai}`, fillColor: '#cccccc',
                  margin: [10, 6, 0, 0], colSpan: 6,
                }, '', '', '', '', ''
              ]]
            }, layout: borderTable,
          }, {
            margin: [5, 0, 5, 8],
            table: {
              headerRows: 1,
              widths: ['*'],
              body: [[
                {
                  margin: [10, 10, 0, 0],
                  columns: [
                    { text: 'เงินสะสมที่จ่ายเข้า ', fontSize: 12 },
                    { text: 'กบข. ', fontSize: 12 },
                    { text: 'บาท ', fontSize: 12 },
                    { text: 'กสจ. ', fontSize: 12 },
                    { text: 'บาท ', fontSize: 12, width: 40 }
                  ],
                }
              ]]
            }, layout: borderTable,
          }, {
            margin: [5, 0, 5, 8],
            table: {
              headerRows: 1,
              widths: ['*'],
              body: [[
                {
                  margin: [10, 10, 0, 0],
                  columns: [
                    { text: 'ผู้จ่ายเงิน ', fontSize: 12, width: 70 },
                    { text: '(1) หักภาษี ณ ที่จ่าย ', fontSize: 12 },
                    { text: '(2) ออกภาษีให้ตลอดไป  ', fontSize: 12 },
                    { text: '(3) ออกภาษีให้ครั้งเดียว ', fontSize: 12 },
                    { text: '(4) อื่นๆ (ระบุ) ............................. ', fontSize: 12 },
                  ]
                }
              ]]
            }, layout: borderTable,
          }, {
            margin: [5, 0, 5, 6],
            table: {
              headerRows: 1,
              widths: [215, 1, '*'],
              body: [[
                {
                  columns: [
                    { text: 'คำเตือน: ', fontSize: 12, width: 37, },
                    {
                      text: `ผู้ที่มีหน้าที่ออกหนังสือรับรองการหักภาษี ณ ที่จ่าย
                            ฝ่าฝืนไม่ปฏิบัติตามมาตรา 50 ทวิ แห่งประมวล
                            รัษฎากร ต้องรับโทษทางอาญาตามมาตรา 35
                            แห่งประมวลรัษฎากร`,
                      fontSize: 12, width: '*',
                    }
                  ],
                  margin: [10, 5, 0, 25]
                },
                { border: [false, false, false, false], text: '' },
                {
                  text: [
                    { text: 'ขอรับรองว่าข้อความและตัวเลขดังกล่าวข้างต้นถูกต้องตรงกับความจริงทุกประการ\n\n', fontSize: 12, alignment: 'center' },
                    {
                      text: 'ลงชื่อ .................................................................................. ผู้จ่ายเงิน\n',
                      fontSize: 12, alignment: 'center'
                    },
                    { text: `${+((data.dateserv).substr(0, 2))} / ${this.main.arrMonthTxt[+((data.dateserv).substr(2, 2)) - 1]} / ${+((data.dateserv).substr(4, 4))}\n`, fontSize: 12, alignment: 'center' },
                    { text: '(วัน เดือน ปี ที่ออกหนังสือรับรอง ฯ)', fontSize: 12, alignment: 'center' },
                  ],
                  margin: [10, 5, 0, 0]
                },
              ]]
            }, layout: borderTable,
          }
          ]]
        ]
      },
      layout: borderTable,
    }]
  }

  taxPdf2(data, borderTable, pageBreak?) {
    return [{
      image: 'data:image/png;base64,' + data.signature,
      width: 100,
      absolutePosition: { x: 338, y: 741 },
      pageBreak: pageBreak,
    }, {
      table: {
        widths: ['*'],
        body: [
          [[{
            text: ['หนังสือรับรองการหักภาษี ณ ที่จ่าย\n', { text: 'ตามมาตรา 50 ทวิ แห่งประมวลรัษฎากร\n', fontSize: 12 }],
            margin: [0, 0, 0, 0], alignment: 'center'
          },
          { text: 'เล่มที่ ...........................\nเลขที่ ...........................', fontSize: 13, absolutePosition: { x: 486, y: 28 } },
          // { text: `${data.id}`, absolutePosition: { x: 516, y: 42 } },
          {
            margin: [2, 2, 2, 0],
            table: {
              widths: ['*'],
              body: [[[
                { text: 'ผู้มีหน้าที่หักภาษี ณ ที่จ่าย :-', margin: [0, 0, 0, 2] },
                {
                  text: 'ชื่อ    ..................................................................................................',
                  margin: [5, 0, 0, 6]
                }, {
                  text: 'ที่อยู่  ......................................................................................................................................................................................................................',
                  margin: [5, 5, 0, 6]
                }, [
                  { text: 'เลขประจำตัวผู้เสียภาษีอากร 13 หลัก', fontSize: 12, absolutePosition: { x: 300, y: 68 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 95, h: 20, lineWidth: 0.3 }], absolutePosition: { x: 310, y: 85 } },
                  { text: 'เลขประจำตัวผู้เสียภาษีอากร', fontSize: 12, absolutePosition: { x: 450, y: 68 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 95, h: 20, lineWidth: 0.3 }], absolutePosition: { x: 448, y: 85 } },
                  { text: '( ให้ระบุว่าเป็น บุคคล นิติบุคคล บริษัท สมาคม หรือคณะบุคคล )', fontSize: 11, absolutePosition: { x: 70, y: 98 } },
                  { text: '( ให้กรอกเฉพาะผู้ไม่มีเลขประจำตัวประชาชน )', fontSize: 9, absolutePosition: { x: 440, y: 106 } },
                  { text: '( ให้ระบุ ชื่ออาคาร/หมู่บ้าน ห้องเลขที่ ชั้นที่ เลขที่ ตรอก/ซอย หมู่ที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด )', fontSize: 11, absolutePosition: { x: 70, y: 127 } },
                  { text: `${this.format_cid(data.department_id)}`, absolutePosition: { x: 319, y: 87 } },
                  { text: `0-0000-0000-0`, absolutePosition: { x: 465, y: 87 } },
                  { text: '', absolutePosition: { x: 430, y: 87 } },
                  { text: `สำนักงานสาธารณสุขจังหวัดชัยภูมิ`, absolutePosition: { x: 70, y: 82 } },
                  { text: 'เลขที่ 280 หมู่ 15 ถ.ชัยภูมิ-แก้งคร้อ ต.ในเมือง อ.เมืองชัยภูมิ จ.ชัยภูมิ 36000', absolutePosition: { x: 70, y: 111 } },
                ]
              ]]]
            }, layout: borderTable,
          }, {
            margin: [2, 5, 2, 5],
            table: {
              widths: ['*'],
              body: [[[
                { text: 'ผู้ถูกหักภาษี ณ ที่จ่าย :-', margin: [0, 0, 0, 2] },
                {
                  text: 'ชื่อ    ..................................................................................................',
                  margin: [5, 0, 0, 6]
                }, {
                  text: 'ที่อยู่  ......................................................................................................................................................................................................................',
                  margin: [5, 5, 0, 6]
                }, {
                  margin: [3, 5, 0, 0], fontSize: 12,
                  text: `ลำดับที่                               ในแบบ`,
                }, {
                  margin: [3, 0, 0, 0], fontSize: 9,
                  text: '(ให้สามารถอ้างอิงหรือสอบอันดับได้ระหว่างลำดับที\nตามหนังสือรับรองฯกับแบบยื่นรายการภาษีหักจ่าย)',
                }, [
                  { text: 'เลขประจำตัวผู้เสียภาษีอากร 13 หลัก', fontSize: 12, absolutePosition: { x: 300, y: 151 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 95, h: 20, lineWidth: 0.3 }], absolutePosition: { x: 310, y: 168 } },
                  { text: 'เลขประจำตัวผู้เสียภาษีอากร', fontSize: 12, absolutePosition: { x: 450, y: 151 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 95, h: 20, lineWidth: 0.3 }], absolutePosition: { x: 448, y: 168 } },
                  { text: '( ให้ระบุว่าเป็น บุคคล นิติบุคคล บริษัท สมาคม หรือคณะบุคคล )', fontSize: 11, absolutePosition: { x: 70, y: 180 } },
                  { text: '( ให้กรอกเฉพาะผู้ไม่มีเลขประจำตัวประชาชน )', fontSize: 9, absolutePosition: { x: 440, y: 189 } },
                  { text: '( ให้ระบุ ชื่ออาคาร/หมู่บ้าน ห้องเลขที่ ชั้นที่ เลขที่ ตรอก/ซอย หมู่ที่ ถนน ตำบล/แขวง อำเภอ/เขต จังหวัด )', fontSize: 11, absolutePosition: { x: 70, y: 210 } },
                  { text: `${this.format_cid(data.cid)}`, absolutePosition: { x: 319, y: 170 } },
                  { text: `0-0000-0000-0`, absolutePosition: { x: 465, y: 170 } },
                  { text: `${data.pname}${data.fname} ${data.lname}`, absolutePosition: { x: 70, y: 165 } },
                  { text: `${data.address}`, absolutePosition: { x: 70, y: 195 } },
                  //=>
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 70, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 68, y: 225 } },
                  // { text: `${data.no}`, absolutePosition: { x: 88, y: 225 } },
                  //=>
                  { text: '(1) ภ.ง.ด.1ก', fontSize: 12, absolutePosition: { x: 266, y: 228 } },
                  { text: '(2) ภ.ง.ด.1ก พิเศษ', fontSize: 12, absolutePosition: { x: 346, y: 228 } },
                  { text: '(3) ภ.ง.ด.2', fontSize: 12, absolutePosition: { x: 446, y: 228 } },
                  { text: '(4) ภ.ง.ด.3', fontSize: 12, absolutePosition: { x: 521, y: 228 } },
                  { text: '(5) ภ.ง.ด.2ก', fontSize: 12, absolutePosition: { x: 266, y: 251 } },
                  { text: '(6) ภ.ง.ด.3ก', fontSize: 12, absolutePosition: { x: 346, y: 251 } },
                  { text: '(7) ภ.ง.ด.53', fontSize: 12, absolutePosition: { x: 446, y: 251 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 245, y: 226 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 325, y: 226 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 425, y: 226 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 500, y: 226 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 245, y: 249 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 325, y: 249 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 425, y: 249 } },
                  { text: 'X', fontSize: 16, absolutePosition: { x: 330, y: 225 } },
                  //==>
                  // { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 142, y: 675 } },
                  // { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 375, y: 675 } },
                  // { text: 'X', fontSize: 16, absolutePosition: reserve(data.reserve) },
                  // { text: `${this.main.number_format(data.reserve_baht / 100, 2)}`, absolutePosition: reserve_baht(data.reserve) },
                  //====>
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 97, y: 695 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 207, y: 695 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 318, y: 695 } },
                  { canvas: [{ type: 'rect', x: 0, y: 0, w: 16, h: 16, lineWidth: 0.3 }], absolutePosition: { x: 429, y: 695 } },
                  { text: 'X', fontSize: 16, absolutePosition: { x: 102, y: 694 } },
                ]
              ]]]
            }, layout: borderTable,
          }, {
            margin: [2, 0, 2, 0],
            table: {
              headerRows: 1,
              widths: ['*', '*', 65, 50, 11, 50, 11],
              body: [[
                { text: 'ประเภทเงินได้พึงประเมินจ่าย', fontSize: 12, alignment: 'center', colSpan: 2, margin: [0, 8, 0, 0] }, '',
                { text: 'วัน เดือน \nหรือปีภาษี ที่จ่าย', fontSize: 12, alignment: 'center', margin: [0, 0, 0, 0] },
                { text: 'จำนวนเงินที่จ่าย ', fontSize: 12, alignment: 'center', colSpan: 2, margin: [0, 8, 0, 0] }, '',
                { text: 'ภาษีที่หัก \nและนำส่งไว้', fontSize: 12, alignment: 'center', colSpan: 2, margin: [0, 0, 0, 0] }, '',
              ], [
                {
                  text: [
                    { text: '1. เงินเดือน ค่าจ้าง เบี้ยเลี้ยงโบนัส ฯลฯ \tตามมาตรา 40(1)\n' },
                    { text: '.', color: 'white' },
                    { text: '   เงินได้เพราะเหตุออกจากงาน \tตามมาตรา40(1)(2)\n' },
                    { text: '2. ค่าธรรมเนียม ค่านายหน้า ฯลฯ \tตามมาตรา 40(2)\n' },
                    { text: '3. ค่าแห่งลิขสิทธ์ิ ฯลฯ \tตามมาตรา 40(3)\n' },
                    { text: '4. (ก) ค่าดอกเบ้ีย ฯลฯ \tตามมาตรา 40(4)(ก)\n' },
                    { text: '.', color: 'white' },
                    { text: '   (ข) เงินปันผล เงินส่วนแบ่งกำไร ฯลฯ \tตามมาตรา 40(4)(ข)\n' },
                    { text: '.', color: 'white' },
                    { text: '\t\t(1) กรณีผู้ได้รับเงินปันผลได้รับเครดิตภาษี โดยจ่ายจาก\n' },
                    { text: '.', color: 'white' },
                    { text: '\t\t\tกำไรสุทธิของกิจการที่ต้องเสียภาษีเงินได้นิติบุคคลในอัตราดังน้ี\n' },
                    { text: '.', color: 'white' },
                    { text: '\t\t\t\t(1.1)\tอัตราร้อยละ 30 \t ของกำไรสุทธิ\n' },
                    { text: '.', color: 'white' },
                    { text: '\t\t\t\t(1.2)\tอัตราร้อยละ 25 \t ของกำไรสุทธิ\n' },
                    { text: '.', color: 'white' },
                    { text: '\t\t\t\t(1.3)\tอัตราร้อยละ 20 \t ของกำไรสุทธิ\n' },
                    { text: '.', color: 'white' },
                    { text: '\t\t\t\t(1.4)\tอัตราอื่น ๆ \t (ระบุ) .................... ของกำไรสุทธิ\n' },
                    { text: '.', color: 'white' },
                    { text: '\t\t(2) กรณีผู้ได้รับเงินปันผลไม่ได้รับเครดิตภาษี เน่ืองจากจ่ายจาก\n' },
                    { text: '.', color: 'white' },
                    { text: '\t\t\t\t(2.1)\tกำไรสุทธิของกิจการที่ได้รับยกเว้นภาษีเงินได้นิติบุคคล\n' },
                    { text: '.', color: 'white' },
                    { text: '\t\t\t\t(2.2)\tเงินปันผลหรือเงินส่วนแบ่งของกำไรท่ีได้รับยกเว้นไม่ต้องนำมารวม\n' },
                    { text: '.', color: 'white' },
                    { text: '\t\t\t\t\t\t\tคำนวณเป็นรายได้เพ่ือเสียภาษีเงินได้นิติบุคคล\n' },
                    { text: '.', color: 'white' },
                    { text: '\t\t\t\t(2.3)\tกำไรสุทธิของกิจการที่ได้หักผลขาดทุนสุทธิยกมาไม่เกิน 5 ปี\n' },
                    { text: '.', color: 'white' },
                    { text: '\t\t\t\t\t\t\tก่อนรอบระยะเวลาบัญชีปีปัจจุบัน\n' },
                    { text: '.', color: 'white' },
                    { text: '\t\t\t\t(2.4)\tกำไรท่ีได้รับรู้ทางบัญชีโดยวิธีส่วนได้เสีย (equity method)\n' },
                    { text: '.', color: 'white' },
                    { text: '\t\t\t\t(2.5)\tอื่น ๆ  (ระบุ) ......................................................................\n' },
                    { text: '5. อ่ืน ๆ  (ระบุ) ....................................................................................................\n' },
                  ],
                  margin: [10, 0, 0, 0], colSpan: 2, fontSize: 11,
                }, '',
                { text: `${data.year}`, alignment: 'center' },
                { text: `${this.main.number_format(+data.expenses, 2).split('.')[0]}`, alignment: 'right' },
                { text: `${this.main.number_format(+data.expenses, 2).split('.')[1]}`, alignment: 'right' },
                { text: `${this.main.number_format((data.tax > 0) ? +data.tax : 0, 2).split('.')[0]}`, alignment: 'right' },
                { text: `${this.main.number_format((data.tax > 0) ? +data.tax : 0, 2).split('.')[1]}`, alignment: 'right' },
              ], [
                {
                  border: [true, true, true, false],
                  text: 'รวมเงินที่จ่ายและภาษีที่หักนำส่ง', fontSize: 12,
                  margin: [0, 2, 30, 0], colSpan: 3, alignment: 'right'
                }, '', '',
                { text: `${this.main.number_format(+data.expenses, 2).split('.')[0]}`, alignment: 'right' },
                { text: `${this.main.number_format(+data.expenses, 2).split('.')[1]}`, alignment: 'right' },
                { text: `${this.main.number_format((data.tax > 0) ? +data.tax : 0, 2).split('.')[0]}`, alignment: 'right' },
                { text: `${this.main.number_format((data.tax > 0) ? +data.tax : 0, 2).split('.')[1]}`, alignment: 'right' },
              ], [
                {
                  border: [true, false, false, true],
                  text: 'รวมเงินภาษีที่หักนำส่ง (ตัวอักษร)', fontSize: 12,
                  margin: [10, 5, 0, 0]
                }, {
                  border: [false, false, true, true],
                  text: `${(+data.tax > 0) ? ThaiBaht(+data.tax) : 'ศูนย์บาทถ้วน'}`, fillColor: '#cccccc',
                  margin: [10, 5, 0, 0], colSpan: 6,
                }, '', '', '', '', ''
              ]]
            }, layout: borderTable,
          }, {
            margin: [2, 0, 2, 0],
            table: {
              headerRows: 1,
              widths: ['*'],
              body: [[
                {
                  margin: [10, 5, 0, 0],
                  columns: [
                    { text: 'เงินที่จ่ายเข้า ', fontSize: 12, width: 70 },
                    { text: 'กบข. ', fontSize: 12, width: 100 },
                    { text: 'บาท ', fontSize: 12, width: 30 },
                    { text: 'กสจ. ', fontSize: 12, width: 100 },
                    { text: 'บาท ', fontSize: 12, width: 30 },
                    { text: 'กองทุนประกันสังคม ', fontSize: 12 },
                    { text: 'บาท ', fontSize: 12, width: 30 }
                  ],
                }
              ]]
            }, layout: borderTable,
          }, {
            margin: [2, 0, 2, 5],
            table: {
              headerRows: 1,
              widths: ['*'],
              body: [[
                {
                  margin: [10, 5, 0, 0],
                  columns: [
                    { text: 'ผู้จ่ายเงิน ', fontSize: 12, width: 70 },
                    { text: '(1) หักภาษี ณ ที่จ่าย ', fontSize: 12 },
                    { text: '(2) ออกภาษีให้ตลอดไป  ', fontSize: 12 },
                    { text: '(3) ออกภาษีให้ครั้งเดียว ', fontSize: 12 },
                    { text: '(4) อื่นๆ (ระบุ) ............................. ', fontSize: 12 },
                  ]
                }
              ]]
            }, layout: borderTable,
          }, {
            margin: [2, 0, 2, 5],
            table: {
              headerRows: 1,
              widths: [215, 1, '*'],
              body: [[
                {
                  columns: [
                    { text: 'คำเตือน: ', fontSize: 12, width: 37, },
                    {
                      text: `ผู้มีหน้าที่ออกหนังสือรับรองการหักภาษี ณ ที่จ่าย
                            ฝ่าฝืนไม่ปฏิบัติตามมาตรา 50 ทวิ แห่งประมวล
                            รัษฎากร ต้องรับโทษทางอาญาตามมาตรา 35
                            แห่งประมวลรัษฎากร`,
                      fontSize: 12, width: '*',
                    }
                  ],
                  margin: [10, 5, 0, 20]
                },
                { border: [false, false, false, false], text: '' },
                {
                  text: [
                    { text: 'ขอรับรองว่าข้อความและตัวเลขดังกล่าวข้างต้นถูกต้องตรงกับความจริงทุกประการ\n\n', fontSize: 12, alignment: 'center' },
                    {
                      text: 'ลงชื่อ .................................................................................. ผู้มีหน้าที่หักภาษี ณ ที่จ่าย\n',
                      fontSize: 12, alignment: 'center'
                    },
                    { text: `${+((data.dateserv).substr(0, 2))} / ${this.main.arrMonthTxt[+((data.dateserv).substr(2, 2)) - 1]} / ${+((data.dateserv).substr(4, 4))}\t\t\t\t\t\t.\n`, fontSize: 12, alignment: 'center' },
                    { text: '(วัน เดือน ปี ที่ออกหนังสือรับรอง ฯ)\t\t\t\t\t\t.', fontSize: 12, alignment: 'center' },
                  ],
                  margin: [10, 5, 0, 0]
                },
              ]]
            }, layout: borderTable,
          }
          ]]
        ]
      },
      layout: borderTable,
    }]
  }

}
