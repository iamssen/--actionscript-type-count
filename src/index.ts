'use strict'

/// <reference path="typings/tsd.d.ts"/>

import * as fs from 'fs';
import * as rx from '@reactivex/rxjs';
import analysis from './analysis';

interface TypeCount {
	classpath:string;
	count:number;
}

let sources:string[] = [
	`${__dirname}/../sources/hyundai.lpims/src`,
	`${__dirname}/../sources/keis/src`,
	`${__dirname}/../sources/samsung.cpfr/src`,
	`${__dirname}/../sources/samsung.dashboard/src`,
	`${__dirname}/../sources/samsung.pjtdashboard/src`,
	`${__dirname}/../sources/samsung.smart3/src`
];

rx.Observable.fromArray(sources)
	.map(source => {
		return rx.Observable.defer(() => {
			return rx.Observable.fromPromise(analysis(source));
		})
	})
	.concatAll()
	.scan((acc:Map<string, number>, x:Map<string, number>) => {
		for (let key of x.keys()) {
			if (acc.has(key)) {
				acc.set(key, acc.get(key) + x.get(key));
			} else {
				acc.set(key, x.get(key));
			}
		}
		return acc;
	})
	.last()
	.subscribe(
		x => {
			let arr:TypeCount[] = [];
			x.forEach((v, k) => arr.push({classpath: k, count: v}));
			arr = arr
				.sort((a, b) => (a.count === b.count) ? 0 : (b.count > a.count) ? 1 : -1)
				.filter(i => i.count > 2);
			fs.writeFile(`${__dirname}/../source.json`, JSON.stringify(arr));
		},
		e => console.log(`Error: ${e}`)
	);



