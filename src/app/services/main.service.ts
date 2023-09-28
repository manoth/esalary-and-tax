import { Injectable, Inject, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { JwtHelperService } from '@auth0/angular-jwt';

@Injectable({ providedIn: 'root' })
export class MainService {

  private jwtHelper = new JwtHelperService();

  constructor(
    @Inject('TOKENNAME') private tokenName: string,
    @Inject('PASSCODENAME') private passcodeName: string,
    @Inject('APIURL') private apiUrl: string,
    @Inject('ADMINTOKEN_NAME') private adminTokenName: string,
    private http: HttpClient,
    private router: Router
  ) { }

  get(path: string) {
    const url: string = `${this.apiUrl}/${path}`;
    return this.http.get(url).toPromise();
  }

  post(path: string, data: any) {
    const url: string = `${this.apiUrl}/${path}`;
    return this.http.post(url, data).toPromise();
  }

  put(path: string, data: any) {
    const url: string = `${this.apiUrl}/${path}`;
    return this.http.put(url, data).toPromise();
  }

  delete(path: string, data: any) {
    const url: string = `${this.apiUrl}/${path}`;
    return this.http.delete(url, data).toPromise();
  }

  getUrl(url: string) {
    return this.http.get(url).toPromise();
  }

  postUrl(url: string, data: any) {
    return this.http.post(url, data).toPromise();
  }

  getArrayBuffer(path: string, type: 'path' | 'url') {
    const url: string = (type == 'path') ? `${this.apiUrl}/${path}` : path;
    return this.http.get(url, { responseType: 'arraybuffer' }).toPromise();
  }

  getBlob(path: string, type: 'path' | 'url') {
    const url: string = (type == 'path') ? `${this.apiUrl}/${path}` : path;
    return this.http.get(url, { responseType: 'blob' }).toPromise();
  }

  public get accessToken(): any {
    return localStorage.getItem(this.tokenName);
  }

  public get accessTokenAdmin(): any {
    return sessionStorage.getItem(this.adminTokenName);
  }

  public get authGuard1() {
    return !this.jwtHelper.isTokenExpired(this.accessToken)
  }

  public get authGuard2() {
    let d = this.jwtDecodeToken();
    return (d.hosptype) ? this.in_array(d.hosptype, ['01', '02', '05', '06', '07']) : false;
  }

  public get authGuard3() {
    let d = this.jwtDecodeToken();
    return (d.hospcode) ? this.in_array(d.hospcode, ['00024']) : false;
  }

  logout(followup?: string) {
    localStorage.removeItem(this.tokenName);
    sessionStorage.removeItem(this.passcodeName);
    if (!followup) {
      this.router.navigate(['/signin']);
    } else {
      window.location.href = followup;
    }
  }

  public onJwtDecode = new EventEmitter();
  public get jwtDecode(): any {
    return this.get('profile').then((res: any) => {
      if (res.ok) {
        this.onJwtDecode.emit(res.data);
        return res.data;
      } else {
        // this.logout();
      }
    }).catch((err: any) => {
      console.log(err);
      // this.logout();
    });
  }

  jwtDecodeToken() {
    const token = this.accessToken;
    try {
      if (!this.jwtHelper.isTokenExpired(token)) {
        const decoded = this.jwtHelper.decodeToken(token);
        return decoded;
      } else {
        localStorage.removeItem(this.tokenName);
        return false;
      }
    } catch (err) {
      localStorage.removeItem(this.tokenName);
      return false;
    }
  }

  jwtDecodeAdmin(adminToken?: string) {
    const token = adminToken || this.accessTokenAdmin;
    try {
      if (!this.jwtHelper.isTokenExpired(token)) {
        const decoded = this.jwtHelper.decodeToken(token);
        return decoded;
      } else {
        sessionStorage.removeItem(this.adminTokenName);
        return false;
      }
    } catch (err) {
      sessionStorage.removeItem(this.adminTokenName);
      return false;
    }
  }

  in_array(str: any, array: Array<any>): boolean {
    return array.indexOf(str) >= 0;
  }

  number_format(number: any, decimals: any) {
    let p = number.toFixed(decimals).split('.');
    return p[0].split('').reverse().reduce((acc, number, i, orig) => {
      return number == '-' ? acc : number + (i && !(i % 3) ? ',' : '') + acc;
    }, '') + '.' + p[1];
  }

  thaiDate(date: any, format: 'full' | 'medium' | 'short'): string {
    let ThaiDay = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์']
    let shortThaiMonth = [
      'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
    ];
    let longThaiMonth = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    let inputDate = new Date(date);
    let dataDate = [
      inputDate.getDay(), inputDate.getDate(), inputDate.getMonth(), inputDate.getFullYear()
    ];
    let outputDateFull = [
      'วัน ' + ThaiDay[dataDate[0]],
      'ที่ ' + dataDate[1],
      'เดือน ' + longThaiMonth[dataDate[2]],
      'พ.ศ. ' + (dataDate[3] + 543)
    ];
    let outputDateMedium = [
      dataDate[1],
      longThaiMonth[dataDate[2]],
      dataDate[3] + 543
    ];
    let outputDateShort = [
      dataDate[1],
      shortThaiMonth[dataDate[2]],
      dataDate[3] + 543
    ];
    let returnDate: string;
    returnDate = outputDateMedium.join(' ');
    if (format == 'full') {
      returnDate = outputDateFull.join(' ');
    }
    if (format == 'medium') {
      returnDate = outputDateMedium.join(' ');
    }
    if (format == 'short') {
      returnDate = outputDateShort.join(' ');
    }
    return returnDate;
  }

  public arrMonthTxt = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];

  isNumberKey(event) {
    var charCode = (event.which) ? event.which : event.keyCode
    if (charCode > 31 && (charCode < 48 || charCode > 57))
      return false;
    return true;
  }

  downloadFile(fileUrl: string, fileName: string) {
    const a = document.createElement('a');
    a.href = fileUrl;
    a.download = `${fileName}.pdf`;
    a.click();
    URL.revokeObjectURL(fileUrl);
  }

  printPDF(pdfUrl: string) {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write('<html><head><title>พิมพ์ PDF</title></head><body>');
      printWindow.document.write(`<embed width="100%" height="100%" type="application/pdf" src="${pdfUrl}">`);
      printWindow.document.write('</body></html>');
      printWindow.document.close();
      // printWindow.print();
    }
  }

  arrayBufferToBase64(buffer) {
    const binary = new Uint8Array(buffer);
    let base64 = '';
    for (let i = 0; i < binary.length; i++) {
      base64 += String.fromCharCode(binary[i]);
    }
    return btoa(base64);
  }

}
