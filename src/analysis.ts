'use strict'

import * as fs from 'fs';
import * as glob from 'glob';
import * as rx from '@reactivex/rxjs';

let reg:RegExp = /import ([a-zA-Z0-9\._]+)/g;

export default function analysis(src:string):Promise<Map<string, number>> {
	return new Promise<Map<string, number>>((resolve, reject) => {
		glob(`${src}/**/*.+(as|mxml)`, (err:Error, files:string[]) => {
			let types:Map<string, number> = new Map;

			rx.Observable
				.fromArray<string>(files)
				.map((file:string) => {
					return rx.Observable.defer(() => {
						return rx.Observable.fromPromise(new Promise<string>((resolve, reject) => {
							fs.readFile(file, {encoding: 'utf8'}, (err:Error, data:string)=> {
								if (err) {
									reject(err);
									return;
								}

								let arr:RegExpMatchArray = data.match(reg);

								if (arr && arr.length > 0) {
									arr.filter((imports:string) => imports && imports.length > 0)
										.map((imports:string) => imports.substr(7))
										.forEach((type:string) => {
											if (types.has(type)) {
												types.set(type, types.get(type) + 1);
											} else {
												types.set(type, 1);
											}
										});
								}
								resolve(file);
							});
						}));
					})
				})
				.concatAll()
				.subscribe(
					null,
					e => console.log(`Error: ${e}`),
					() => resolve(types)
				);
		})
	});
}