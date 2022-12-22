class ICS{
	
	constructor(name){
		this.calname = name;
		this.timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		this.desc = null;
		this.color = 'turquoise';
		this.events = [];
	}
	
	setColor(color){
		this.color = color;
	}
	
	setDesc(desc){
		this.desc = desc;
	}
	
	build(){
		const buffer = [
			`BEGIN:VCALENDAR`,
			`VERSION:2.0`,
			`PRODID:-//ICS.js//Event Calendar//EN`,
			`NAME:${this.calname}`,
			`X-WR-CALNAME:${this.calname}`
		];
		if(this.desc){
			buffer.push(`DESCRIPTION:${this.desc}`);
			buffer.push(`X-WR-CALDESC:${this.desc}`);
		}
		buffer.push(`TIMEZONE-ID:${this.timezone}`);
		buffer.push(`X-WR-TIMEZONE:${this.timezone}`);
		buffer.push(`COLOR:${this.color}`);
		buffer.push(`CALSCALE:GREGORIAN`);
		for(let i=0; i<this.events.length; i++){
			buffer.push(`BEGIN:VEVENT`);
			if(this.events[i].description){
				buffer.push(`DESCRIPTION:${this.events[i].description}`);
			}
			buffer.push(`DTEND;VALUE=DATE:${this.getUTCDateEnd(this.events[i].date)}`);
			buffer.push(`DTSTAMP:${this.getUTCDateTimeStr(this.events[i].modified)}`);
			buffer.push(`DTSTART;VALUE=DATE:${this.getUTCDateStart(this.events[i].date)}`);
			buffer.push(`LAST-MODIFIED:${this.getUTCDateTimeStr(this.events[i].modified)}`);
			buffer.push(`SUMMARY:${this.events[i].title}`);
			buffer.push(`UID:${this.uuidv4()}`);
			buffer.push(`END:VEVENT`);
		}
		buffer.push(`END:VCALENDAR`);
		return buffer.join("\n");
	}
	
	getUTCDateStart(date){
		var year = `${date.getFullYear()}`.padStart(4,'0');
		var month = `${date.getMonth()+1}`.padStart(2,'0');
		var day = `${date.getDate()}`.padStart(2,'0');
		return `${year}${month}${day}`;
	}
	
	getUTCDateEnd(date){
		var year = `${date.getFullYear()}`.padStart(4,'0');
		var month = `${date.getMonth()+1}`.padStart(2,'0');
		var day = `${date.getDate()+1}`.padStart(2,'0');
		return `${year}${month}${day}`;
	}
	
	getUTCDateTimeStr(date){
		var year = `${date.getUTCFullYear()}`.padStart(4,'0');
		var month = `${date.getUTCMonth()+1}`.padStart(2,'0');
		var day = `${date.getUTCDate()}`.padStart(2,'0');
		var hour = `${date.getUTCHours()}`.padStart(2,'0');
		var min = `${date.getUTCMinutes()}`.padStart(2,'0');
		var sec = `${date.getUTCSeconds()}`.padStart(2,'0');
		return `${year}${month}${day}T${hour}${min}${sec}Z`;
	}
	
    addEvent(title, description, date) {
		this.events.push({
			title,
			date,
			modified: new Date(),
			description
		});
	}
	
	uuidv4() {
		return ([1e7] + -1e3 + -4e3 + -8e3 + -1e11).replace(/[018]/g, c =>
			(c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
		);
	}
	
}