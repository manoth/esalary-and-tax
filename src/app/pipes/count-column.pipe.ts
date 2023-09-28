import { Pipe, PipeTransform } from '@angular/core';
@Pipe({
    name: 'sumColumn'
})
export class SumColumnPipe implements PipeTransform {
    transform(items: any[], search: string): any {
        let value = 0;
        if (!items) return [];
        for (let i = 0; i < items.length; i++) {
            value = (+items[i][search]) + value;
        }
        return value;
    }
}