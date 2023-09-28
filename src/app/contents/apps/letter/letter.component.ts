import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { IMyDpOptions } from 'mydatepicker-thai';
import { ImagesService, MainService } from 'src/app/services';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import Swal from 'sweetalert2';
import fontkit from '@pdf-lib/fontkit';
// import fontkit from 'fontkit';

declare const $: any;
@Component({
  selector: 'app-letter',
  templateUrl: './letter.component.html',
  styleUrls: ['./letter.component.scss']
})
export class LetterComponent implements OnInit {

  public loading: boolean = true;
  public decode: any;
  public bYear: any;
  public bYearArr: any[] = [];

  public letter = new Letter();
  public searchTerm: string = '';
  public book: any[] = [];
  public bookDate: any;
  public bookSpeed: any[] = [];
  public bookType: any[] = [];
  public bookSend: any[] = [];
  public sendTo: string = 'all';
  public sendHospital: any[] = [];
  public sendSso: any[] = [];
  public bookNumber: any;
  public myDateOptions: IMyDpOptions = {
    dateFormat: 'dd mmm yyyy',
    satHighlight: true,
    editableDateField: false,
    openSelectorOnInputClick: true,
    showClearDateBtn: false
  };
  public pdfFile: any;
  public tabActive: string = 'all';
  public pageDetail: string = '';
  public detail: any;
  public receiveArr: any[] = [];
  public newBookNotReceive: number = 0;
  public sendToArr: any[] = [];

  public receiverCid: string = '';
  public receiverList: any[] = [];

  constructor(
    public router: Router,
    public route: ActivatedRoute,
    public main: MainService,
    public images: ImagesService
  ) {
    this.main.jwtDecode.then((decode: any) => {
      // console.log(decode);
      this.decode = decode;
      this.route.params.subscribe((params: Params) => {
        if (!this.inTabsCpho(params.page) && !this.inTabsHospital(params.page) && !this.inTabWrite(params.page)) {
          (this.authGuard3) ?
            this.router.navigate(['/apps/letter/all']) :
            this.router.navigate(['/apps/letter/inbox']);
        } else {
          if (this.authGuard3 && this.inTabsHospital(params.page)) {
            this.router.navigate(['/apps/letter/all'])
          }
          if (!this.authGuard3 && (this.inTabsCpho(params.page) || this.inTabWrite(params.page))) {
            this.router.navigate(['/apps/letter/inbox'])
          }
        }
        this.tabActive = params.page;
        this.getLookup();
      });
    });
  }

  ngOnInit() {
    this.route.queryParams.subscribe((queryParams) => {
      this.pageDetail = queryParams['detail'];
      this.getBookDetail(this.pageDetail);
    });
    let d = new Date();
    this.bookDate = { date: { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() } }
    this.loading = false;
  }

  public get authGuard3() {
    return this.main.authGuard3;
  }

  inTabsCpho(page: string): boolean {
    return this.main.in_array(page, ['all', 'group', 'sent']);
  }

  inTabWrite(page: string): boolean {
    return this.main.in_array(page, ['write']);
  }

  inTabsHospital(page: string): boolean {
    return this.main.in_array(page, ['inbox', 'receive']);
  }

  getBookDetail(letterId: string) {
    this.loading = true;
    this.main.get(`letter/book/detail/letterId/${letterId}`).then((res: any) => {
      // console.log(res);
      this.detail = (res.ok) ? res.data : this.router.navigate([`/apps/letter/${this.tabActive}`]);
      (res.ok) ? this.getPdfData(res.data.book_file, res.data.receive_date, res.data.receive_no) : (this.loading = false);
    });
  }

  getBook(bYear: string) {
    if (!this.inTabWrite(this.tabActive)) {
      let pageId = (this.tabActive == 'sent') ? this.decode.cid :
        (this.tabActive == 'group') ? this.decode.workgroup : 'all'
      this.main.get(`letter/book/${this.tabActive}/${pageId}/bYear/${bYear}`).then((res: any) => {
        this.book = (res.ok) ? res.data : [];
        this.loading = false;
      });
    } else {
      this.loading = false;
    }
  }

  getLookup() {
    this.loading = true;
    this.main.get(`letter/book/form/lookup`).then((res: any) => {
      this.bYearArr = (res.ok) ? res.bYear : [];
      this.bYear = (res.ok) ? this.bYearArr[0].b_year : new Date().getFullYear();
      this.bookSpeed = (res.ok) ? res.speed : [];
      this.bookType = (res.ok) ? res.type : [];
      this.bookSend = (res.ok) ? res.recipient : [];
      this.sendHospital = (res.ok) ? res.hospital : [];
      this.sendSso = (res.ok) ? res.sso : [];
      this.bookNumber = (res.ok) ? res.bookNumber[0] : {};
      this.newBookNotReceive = (res.ok) ? res.qtyNewBook[0].qty : 0;
      this.onChangSendTo();
      this.getBook(this.bYear);
    });
  }

  txtSender(decode: any) {
    return ((decode.workgroup_sub_name) ? decode.workgroup_sub_name + '/' : '') + `${decode.workgroup_name} - ${decode.hospname}`;
  }

  onChangSendTo() {
    this.sendToArr = [];
    if (this.main.in_array(this.sendTo, ['all', 'hospital-all'])) {
      for (let h of this.sendHospital) { this.sendToArr.push(h.hoscode); }
    }
    if (this.main.in_array(this.sendTo, ['all', 'sso-all'])) {
      for (let s of this.sendSso) { this.sendToArr.push(s.hoscode); }
    }
  }

  onCheckSendTo(e: any) {
    if (e.target.checked) {
      this.sendToArr.push(e.target.value);
    } else {
      this.sendToArr = this.sendToArr.filter(v => v != e.target.value);
    }
  }

  fileProgress(files: any) {
    this.pdfFile = null;
    if (files.length > 0) {
      const fileType = files[0].type;
      if (fileType.match(/pdf\/*/) == null) {
        return;
      } else {
        this.pdfFile = files[0];
      }
    }
  }

  onSubmit() {
    if (this.bookDate && this.letter.book_number && this.letter.book_topic &&
      this.letter.book_page > 0 && this.sendToArr.length > 0 && this.pdfFile) {
      this.loading = true;
      this.letter.sender_cid = this.decode.cid;
      this.letter.sender = `${this.decode.prename}${this.decode.fname} ${this.decode.lname}`;
      this.letter.sender_hospital = this.decode.hospname;
      this.letter.sender_workgroup_code = this.decode.workgroup;
      this.letter.sender_workgroup = this.decode.workgroup_name;
      this.letter.sender_workgroup_sub_code = this.decode.workgroup_sub;
      this.letter.sender_workgroup_sub = this.decode.workgroup_sub_name;
      this.letter.book_date = `${this.bookDate.date.year}-${this.bookDate.date.month}-${this.bookDate.date.day}`;
      this.letter.book_number = `${this.bookNumber.book_number}${this.letter.book_number}`;
      this.letter.book_send = this.sendTo;
      this.letter.qty_send = this.sendToArr.length;
      const formData: FormData = new FormData();
      formData.append('pdfFile', this.pdfFile);
      formData.append('letter', JSON.stringify(this.letter));
      formData.append('sendTo', JSON.stringify(this.sendToArr));
      this.main.post(`letter/book`, formData).then((res: any) => {
        this.loading = false;
        Swal.fire({
          title: res.message,
          icon: 'success',
          allowOutsideClick: false
        }).then((result) => {
          if (res.ok) {
            this.ngOnInit();
            this.letter = new Letter();
            this.sendTo = 'all';
            this.router.navigate(['/apps/letter/sent']);
          }
        });
      }).catch((err: any) => {
        this.loading = false;
        Swal.fire({
          title: 'เกิดข้อผิดพลาด!',
          text: err.message,
          icon: 'error',
          allowOutsideClick: false
        });
      });
    } else {
      Swal.fire({
        title: 'เกิดข้อผิดพลาด!',
        text: 'คุณยังไม่ได้แนบไฟล์เอกสาร หรือกรอกข้อมูลที่จำเป็นยังไม่ครบถ้วน!',
        icon: 'warning',
        allowOutsideClick: false
      });
    }
  }

  onDel(letterId: string, bookTopic: string) {
    Swal.fire({
      title: 'คุณต้องการลบหนังสือ',
      text: `เรื่อง ${bookTopic} ใช่ หรือ ไม่?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'ใช่',
      cancelButtonText: 'ไม่ใช่',
      allowOutsideClick: false
    }).then((result) => {
      if (result.value) {
        this.main.delete(`letter/book/letterId/${letterId}`, {}).then((res: any) => {
          Swal.fire({
            title: (res.ok) ? 'ยินดีด้วย!' : 'เกิดข้อผิดพลาด!',
            text: res.message,
            icon: (res.ok) ? 'success' : 'error',
            showConfirmButton: !res.ok,
            timer: (res.ok) ? 1500 : 0
          });
          if (res.ok) {
            this.getBook(this.bYear);
          }
        });
      }
    });
  }

  onReceive(letterId: string, bookTopic: string) {
    if (this.decode.letter == 'Y') {
      Swal.fire({
        title: 'ลงเลขที่รับหนังสือเวียน',
        text: `เรื่อง ${bookTopic} \n\rเพื่อดูข้อมูลและ Download เอกสาร`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'ลงรับ',
        cancelButtonText: 'ไม่ลงรับ',
        allowOutsideClick: false,
        input: 'number',
        showLoaderOnConfirm: false
      }).then((result) => {
        if (!result.dismiss) {
          if (result.value) {
            this.main.put(`letter/book/receive/${letterId}`, { receiveNo: result.value }).then((res: any) => {
              Swal.fire({
                title: (res.ok) ? 'ยินดีด้วย!' : 'เกิดข้อผิดพลาด!',
                text: res.message,
                icon: (res.ok) ? 'success' : 'error',
                showConfirmButton: !res.ok,
                timer: (res.ok) ? 1500 : 0
              });
              if (res.ok) {
                this.router.navigate(['/apps/letter/receive'], { queryParams: { detail: letterId } });
              }
            });
          } else {
            Swal.fire({
              title: 'เกิดข้อผิดพลาด!',
              text: 'คุณยังไม่ได้ใส่เลขที่ลงรับหนังสือเวียน',
              icon: 'error',
              allowOutsideClick: false
            });
          }
        }
      });
    } else {
      Swal.fire({
        title: 'คุณไม่มีสิทธิ์ลงรับหนังสือเวียนภายนอก!',
        text: 'กรุณาติต่อผู้ดูแลระบบ เพื่อขอสิทธิ์เข้าใช้งาน',
        icon: 'warning',
        allowOutsideClick: false
      });
    }
  }

  onViewReceive(letterId: string) {
    this.main.get(`letter/book/receive/${letterId}`).then((res: any) => {
      this.getBookDetail(letterId);
      $('#view-receive').modal();
      this.receiveArr = (res.ok) ? res.data : [];
    });
  }

  onListReceiver() {
    this.getListReceiver();
    $('#list-receive').modal();
  }

  getListReceiver() {
    this.main.get('letter/book/receiver/list').then((res: any) => {
      this.receiverList = (res.ok) ? res.data : [];
    });
  }

  addReceiver() {
    if (this.receiverCid) {
      this.main.post('letter/book/receiver', { cid: this.receiverCid }).then((res: any) => {
        Swal.fire({
          title: (res.ok) ? 'ยินดีด้วย!' : 'เกิดข้อผิดพลาด!',
          text: res.message,
          icon: (res.ok) ? 'success' : 'error',
          allowOutsideClick: false
        });
        (res.ok) ? this.getListReceiver() : null;
        this.receiverCid = (!res.ok) ? this.receiverCid : '';
      });
    }
  }

  delReceiver(item: any) {
    Swal.fire({
      title: `คุณแน่ในที่จะลบ ${item.prename}${item.fname} ${item.lname} ออกจากผู้รับผิดชอบหนังสือเวียน ใช่หรือไม่?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'ใช่',
      cancelButtonText: 'ไม่ใช่',
      allowOutsideClick: false
    }).then((result) => {
      if (result.value) {
        this.main.delete(`letter/book/receiver/${item.cid}`, {}).then((res: any) => {
          Swal.fire({
            title: (res.ok) ? 'ยินดีด้วย!' : 'เกิดข้อผิดพลาด!',
            text: res.message,
            icon: (res.ok) ? 'success' : 'error',
            allowOutsideClick: false
          });
          (res.ok) ? this.getListReceiver() : null;
        });
      }
    });
  }

  pdfUrl: string;
  getPdfData(pdfUrl: string, receiveDate: any, receiveNo: string) {
    this.main.getArrayBuffer(pdfUrl, 'url').then((pdfArrayBuffer: ArrayBuffer) => {
      if (this.authGuard3) {
        const blob = new Blob([pdfArrayBuffer], { type: 'application/pdf' });
        this.pdfUrl = URL.createObjectURL(blob);
        this.loading = false;
      } else {
        this.addWatermark(pdfArrayBuffer, receiveDate, receiveNo);
      }
    });
  }

  onDownload(fileName: string) {
    this.main.downloadFile(this.pdfUrl, fileName);
  }

  onPrint() {
    this.main.printPDF(this.pdfUrl);
  }

  async addWatermark(pdfArrayBuffer, receiveDate: any, receiveNo: string) {
    const d = new Date(receiveDate);
    const pdfDoc = await PDFDocument.load(pdfArrayBuffer);
    pdfDoc.registerFontkit(fontkit);
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    const fontUrl = 'files/letter/font/THSarabunNew';
    const fontBytes = await this.main.getArrayBuffer(fontUrl, 'path').then();
    const thSarabunNew = await pdfDoc.embedFont(fontBytes, { subset: true });

    const imageUrl = `files/letter/receive/${this.decode.hospcode}`;
    const imageArrayBuffer = await this.main.getArrayBuffer(imageUrl, 'path').then();
    const imageBase64 = await this.main.arrayBufferToBase64(imageArrayBuffer);
    const image = await pdfDoc.embedPng(`data:image/png;base64,${imageBase64}`);
    firstPage.drawImage(image, { x: width - 200, y: height - 90, width: 170, height: 60, });
    firstPage.drawText(receiveNo, { x: width - 125, y: height - 60, size: 16, font: thSarabunNew, });
    firstPage.drawText(this.main.thaiDate(receiveDate, 'short'), { x: width - 170, y: height - 74.5, size: 16, font: thSarabunNew, });
    firstPage.drawText(`${d.getUTCHours()}:${d.getUTCMinutes()} น.`, { x: width - 85, y: height - 74.5, size: 16, font: thSarabunNew, });

    // firstPage.drawText('สำนักงานสาธารณสุขจังหวัดชัยภูมิ', {
    //   x: 130,
    //   y: height - 120,
    //   size: 50,
    //   font: helveticaFont,
    //   color: rgb(0.95, 0.1, 0.1),
    //   rotate: degrees(-45),
    // });
    const modifiedPdfArrayBuffer = await pdfDoc.save();
    const blob = new Blob([modifiedPdfArrayBuffer], { type: 'application/pdf' });
    this.pdfUrl = URL.createObjectURL(blob);
    this.loading = false;
  }

}

export class Letter {
  sender_cid: string;
  sender: string;
  sender_hospital: string;
  sender_workgroup_code: string;
  sender_workgroup: string;
  sender_workgroup_sub_code: string;
  sender_workgroup_sub: string;
  book_number: string;
  book_date: string;
  book_page: number;
  book_speed: string = '1';
  book_type: string = '1';
  book_send: string;
  book_topic: string;
  book_note: string;
  book_file: string;
  qty_send: number;
}
