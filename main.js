
const submit_btn = document.getElementById("calc_btn");
const start_date_input = document.getElementById("start_date");
const end_date_input = document.getElementById("end_date");
const form_errors_div = document.getElementById("form-errors");
const current_weekly_mileage_input = document.getElementById("current_weekly_mileage");
const unit_of_measurement_input = document.getElementById("units-of-measurement");
const race_distance_input = document.getElementById("race_distance");
const long_run_day_input = document.getElementById("long-run-day");
const training_days_inputs = [...document.querySelectorAll("input.runs-days")];
const calendar_wrapper = document.getElementById("calendar-wrapper");
const dl_cal_btn = document.getElementById('dl_cal_btn');

var ics_object = null;

dl_cal_btn.addEventListener('click', function(e){
	e.preventDefault();
	if(!ics_object) return;
	var calendar = ics_object.build();
	var element = document.createElement('a');
	element.setAttribute('href', 'data:text/calendar;charset=utf-8,' + encodeURIComponent(calendar));
	element.setAttribute('download', 'training_plan.ics');
	element.style.display = 'none';
	document.body.appendChild(element);
	element.click();
	document.body.removeChild(element);
});

submit_btn.addEventListener('click', function(e){
	e.preventDefault();
	validateAndGenerate();
});

function makeCalendar(plan, start_date, end_date, training_days, lr_day, units, race_date){
	var days = {};
	var curr_date = new Date(start_date.getFullYear(), start_date.getMonth(), start_date.getDate());
	curr_date.setDate(curr_date.getDate() - (curr_date.getDay()+1))
	
	for(let week=0; week<plan.length; week++){
		var weekly_plan = plan[week];
		var weekly_distance = weekly_plan.reduce((a,b)=>a+b,0);
		var long_run = weekly_plan.reduce((acc, curr)=>Math.max(acc, curr), 0);
		weekly_plan.splice(weekly_plan.indexOf(long_run), 1);
		
		for(let day=0; day<7; day++){
			curr_date.setDate(curr_date.getDate() + 1);
			if(curr_date < start_date) continue;
			var month_year = `${curr_date.getMonth()+1}/${curr_date.getFullYear()}`;
			if(!days[month_year]) days[month_year] = [];
			var date = curr_date.getDate();
			var distance = 0;
			
			var is_long_run = day == lr_day;
			if(is_long_run) distance = long_run
			else if(training_days.includes(day) && weekly_plan.length) distance = weekly_plan.shift();
			if(distance !== 0) days[month_year].push({date, distance, week, is_long_run, weekly_distance});
		}
	}
	
	var events = [];
	
	ics_object = new ICS(`Race Training Calendar`);
	
	Object.keys(days).forEach(key=>{
		var [month, year] = key.split("/").map(e=>+e);
		days[key].forEach(day=>{
			var date = new Date(year, month-1, day.date);
			events.push({date, desc: `${day.distance}${units == 'm' ? 'm' : 'k'}`});
			var desc = day.is_long_run ? `Long Run: ${day.distance}${units == 'm' ? 'm' : 'k'}` : `Run: ${day.distance}${units == 'm' ? 'm' : 'k'}`;
			ics_object.addEvent(desc, ``, date);
		});
	});
	
	events.push({date:end_date, desc: 'Race Day!'});
	ics_object.addEvent('Race Day!', ``, end_date);
	
	calendar_wrapper.innerHTML = '<div id="calendar"></div>';
	new calendar(document.getElementById('calendar'), {events});
	
	dl_cal_btn.style.display = null;
}

function validateAndGenerate(){
	var errors = [];
	var start_date, 
		end_date, 
		total_weeks, 
		current_weekly_mileage,
		units,
		race_distance,
		long_run_day,
		training_days;
	
	ics_object = null
	dl_cal_btn.style.display = "none";
	
	calendar_wrapper.innerHTML = '';
	
	// Validate Inputs
	if(!start_date_input.value){
		errors.push({
			msg: "A start date is required.",
			ele: start_date_input
		});
	}else{
		let [sy, sm, sd] = start_date_input.value.split(/\D/g);
		start_date = new Date(sy, sm-1, sd);
	}
	
	if(!end_date_input.value){
		errors.push({
			msg: "An end date (race date) is required.",
			ele: end_date_input
		});
	}else{
		let [ey, em, ed] = end_date_input.value.split(/\D/g);
		end_date = new Date(ey, em-1, ed);
	}
	
	if(end_date <= start_date){
		errors.push({
			msg: "Race date cannot be before the start date.",
			ele: end_date_input
		});
	}
	
	total_weeks = Math.ceil((end_date - start_date) / (1000 * 60 * 60 * 24 * 7));
	if(total_weeks < 4){
		errors.push({
			msg: "Race date is too close to start date. Training plan must be at least 4 weeks long.",
			ele: end_date_input
		});
	}
	
	if(!current_weekly_mileage_input.value || isNaN(parseInt(current_weekly_mileage_input.value))){
		errors.push({
			msg: "Invalid current weekly mileage.",
			ele: current_weekly_mileage_input
		});
	}else{
		current_weekly_mileage = parseInt(current_weekly_mileage_input.value);
	}
	
	units = unit_of_measurement_input.value == 'k' ? 'k' : 'm';
	
	race_distance = parseInt(race_distance_input.value);
	
	long_run_day = parseInt(long_run_day_input.value);
	
	training_days = training_days_inputs.filter(input=>input.checked).map(input=>parseInt(input.value));
	
	if(training_days.length !== 4 && training_days.length !== 5){
		errors.push({
			msg: `You must select either 4 or 5 training days. You selected ${training_days.length}.`,
		});
	}
	
	if(!training_days.includes(long_run_day)){
		errors.push({
			msg: `Your long run day must be one of your selected training days.`,
			ele: long_run_day_input
		});
	}
	
	if(errors.length){
		form_errors_div.innerHTML = errors.map(e=>{
			if(e.ele) e.ele.classList.add('is-invalid');
			return `<div class="alert alert-danger alert-dismissible fade show" role="alert">
				<i class="fa-solid fa-triangle-exclamation"></i> ${e.msg}
				<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
			</div>`;
		}).join("");
		return;
	}else{
		form_errors_div.innerHTML = '';
		document.querySelectorAll(".is-invalid").forEach(ele=>ele.classList.remove("is-invalid"));
	}
	
	var plan = generatePlan(total_weeks, race_distance, current_weekly_mileage, training_days.length, units);
	if(plan.errors.length){
		form_errors_div.innerHTML = errors.map(e=>{
			e.ele.classList.add('is-invalid');
			return `<div class="alert alert-danger alert-dismissible fade show" role="alert">
				<i class="fa-solid fa-triangle-exclamation"></i> ${e.msg}
				<button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
			</div>`;
		}).join("");
	}else{
		form_errors_div.innerHTML = '';
		document.querySelectorAll(".is-invalid").forEach(ele=>ele.classList.remove("is-invalid"));
	}
	
	if(!plan.plan.length) return;
	
	makeCalendar(plan.plan, start_date, end_date, training_days, long_run_day, units);
}

function generatePlan(weeks, raceDistance, startingWeeklyMilage, daysPerWeek, units = 'm') {

	var result = {
		errors: [],
		plan: []
	};

	if (isNaN(weeks) || isNaN(raceDistance) || isNaN(startingWeeklyMilage)) {
		result.errors.push("Invalid inputs.");
		return result;
	}

	var deloadWeeks = 4;
	var longestLongRun = 511110.4 + (-11.36087 - 511110.4) / (1 + (raceDistance / 2616438000) ** 0.5287783);
	if (units  != 'm') longestLongRun = longestLongRun * 1.6;
	
	var longRunRatio = 0.4;

	//PLAN TYPES
	var planReg, planTaper1, planTaper2;
	if (daysPerWeek == 4) {
		planReg = [0.2, 0.2, longRunRatio, 0.2];
		planTaper1 = [0.2, 0.1, 0.3];
		planTaper2 = [0.2, 0.1];
	} else {
		planReg = [0.1, 0.2, 0.1, longRunRatio, 0.2];
		planTaper1 = [0.1, 0.2, 0.1, 0.3];
		planTaper2 = [0.1, 0.2, 0.1];
	}

	// Calculate how much we have to increase each week
	var numDeloadWeeks = weeks / deloadWeeks;
	var numActiveWeeks = weeks - numDeloadWeeks - 2;
	var longestWeek = longestLongRun / longRunRatio;
	var weeklyDistanceToAdd = longestWeek - startingWeeklyMilage;

	if (weeklyDistanceToAdd <= 0) {
		result.errors.push("You are too advanced for this plan generator. We recommending find a plan more specific to your needs.");
	}

	//The multipler we need to do to hit our goal
	var weeklyIncrease = weeklyDistanceToAdd / numActiveWeeks;

	var deloadAmount = 0.75;

	var currentWeekMilage = startingWeeklyMilage;
	var deloadWeek = false;
	var lastKnownMilage = currentWeekMilage;

	// You're gonna hurt yourself lol
	if (currentWeekMilage * 0.15 < weeklyIncrease) {
		result.errors.push("Increasing milage by more than 10% per week may lead to injury. Given the time to your race and how much you are running right now, you are putting yourself at risk for injury before your race. Consider choosing a shorter race or one further into the future.");
	}
	
	for(var curWeek = 0; curWeek < weeks; curWeek++){
		
		// Taper week
		if(curWeek >= weeks - 3){
			if(curWeek <= weeks - 2){
				result.plan.push(planTaper1.map(ratio=>Math.round(ratio * currentWeekMilage * 2) / 2));
				currentWeekMilage *= 0.7;
			}else{
				result.plan.push(planTaper2.map(ratio=>Math.round(ratio * currentWeekMilage * 2) / 2));
			}
		}

		// Deload week
		else if((curWeek + 1) % deloadWeeks == 0){
			deloadWeek = true;
			lastKnownMilage = currentWeekMilage;
			currentWeekMilage = currentWeekMilage * deloadAmount;
			result.plan.push(planReg.map(ratio=>Math.round(ratio * currentWeekMilage * 2) / 2));
		}

		// Normal week
		else{
			// Regular week
			if (deloadWeek) {
				// last week was deload, we need to reset
				deloadWeek = false;
				currentWeekMilage = lastKnownMilage;
			}
			//bump milage
			result.plan.push(planReg.map(ratio=>Math.round(ratio * currentWeekMilage * 2) / 2));
			currentWeekMilage += weeklyIncrease;
		}
			
	}
	
	return result;
}
