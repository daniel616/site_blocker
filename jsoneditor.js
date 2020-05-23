var uniqNum=0;
let TIME="T";
let WEEKDAY="W";
let MONTHDAY="M";

function fetchUniqNum(){
    let num = uniqNum;
    uniqNum+=1;
    return num;
}

function getFormID(){
    let num = uniqNum;
    uniqNum+=1;
    return "form"+num.toString();
}

function makeEl(st){
    return document.createElement(st);
}

function makeButton(text,action){
    let button=makeEl('button');
    button.innerText=text;
    button.onclick=action;
    button.type='button';
    return button;
}

function removableSelector(options,name){
    let div = makeEl("div");
    let input=makeEl("select");
    input['required'] = true;
    for (let idx in options){
        let day=options[idx];
        let option = makeEl("option");
        option.innerText=day;
        option.setAttribute("value",day);
        input.appendChild(option);
    }
    let remove=makeButton("-",()=>div.remove());
    div.append(input,remove);
    input.setAttribute('class','selection');
    input.name=name;
    return div;
}

function makeTimeRangeSelector(){
    let div = makeEl('div');
    let lo = makeEl('input');
    lo.type='time';
    lo.className='lo';
    let num = fetchUniqNum();
    lo.name='loTime_'+num;
    let hi = makeEl('input');
    hi['type']='time';
    hi['className']='hi';
    hi['name']='hiTime_'+num;

    lo['required']=true;
    hi['required']=true;
    let loLabel=makeEl('label');
    loLabel.innerText='Min time:';
    let hiLabel=makeEl('label');
    hiLabel.innerText='Max time:';

    let remove=makeButton("-",()=>div.remove());
    div.append(loLabel,lo,hiLabel,hi,remove);
    return div;
}

function makeWeekDaySelector(){
    let div = makeEl("div");
    let input=makeEl("select");
    input['required'] = true;
    let values=[0,1,2,3,4,5,6];
    let options=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    for (var idx=0; idx<options.length;idx++){
        let option = makeEl("option");
        option.innerText=options[idx];
        option.value=values[idx];
        input.appendChild(option);
    }
    let remove=makeButton("-",()=>div.remove());
    div.append(input,remove);
    input.setAttribute('class','selection');
    input.name='allowedWeekDay_'+fetchUniqNum();
    return div;
}

function makeMonthDaySelector(){
    var options=[];
    for (var i =1;i<=31;i++){
        options.push(i);
    }
    let id = 'allowedMonthDay_'+fetchUniqNum();
    return removableSelector(options,id);
}

function getMatchingClass(parent,classname){
    for (var j=0; j<parent.childNodes.length;j++){
        if(parent.childNodes[j].className===classname){
            return parent.childNodes[j];
        }
    }
    assert(false,"no matching class");
}

function getMatchingName(parent,classname){
    for (var j=0; j<parent.childNodes.length;j++){
        if(parent.childNodes[j].name===classname){
            return parent.childNodes[j];
        }
    }
    assert(false,"no matching name")
}

function getDescendantInputs(parentID){
    let anSelector="#"+parentID;
    let inputs=$(anSelector+" input");
    let selects=$(anSelector+" select");
    let all = $.merge(inputs,selects);
    var ret={};
    for (var i =0; i<all.length; i++){
        let inputHTML = all[i];
        if(inputHTML.hasOwnProperty("data-ignore")&&inputHTML["data-ignore"]){
            continue;
        }
        if(inputHTML["name"]==="warnOnly"){
            ret['warnOnly']=inputHTML.checked;
        }else{
            ret[inputHTML["name"]]=inputHTML["value"];
        }
    }
    return ret;
}

function blankAllowDiv(){
    let allowIf=makeEl('div');
    let timeDiv=makeEl('div');
    timeDiv.className='timeDiv';
    let weekDiv=makeEl('div');
    weekDiv.className='weekDiv';
    let monthDayDiv=makeEl('div');
    monthDayDiv.className='monthDayDiv';

    let chooseAdd=makeEl("select");
    chooseAdd['data-ignore']=true;
    let labels=["Time of day","Day of week", "Day of month"];
    let values=[TIME,WEEKDAY,MONTHDAY];
    for(var i=0; i<labels.length;i++){
        let option = makeEl("option");
        option.innerText=labels[i];
        option.setAttribute("value",values[i]);
        chooseAdd.appendChild(option);
    }

    let addAllow=makeButton("+", function(){
        switch(chooseAdd.value){
            case TIME:
                timeDiv.append(makeTimeRangeSelector());
                break;
            case WEEKDAY:
                weekDiv.append(makeWeekDaySelector());
                break;
            case MONTHDAY:
                monthDayDiv.append(makeMonthDaySelector());
                break;
            default:
                alert('error');
                break;
        }
    });
    let id=fetchUniqNum().toString();
    addAllow["id"]=id;
    let descriptor = makeEl("label");
    descriptor["innerText"]="Add permissions based on: ";
    descriptor["for"]=id;


    allowIf.append(timeDiv,weekDiv,monthDayDiv,descriptor,chooseAdd,addAllow);
    return allowIf;
}


function setAllowDiv(allowDiv, allowRules){
    let timeDiv=getMatchingClass(allowDiv,'timeDiv');
    let weekDiv=getMatchingClass(allowDiv,'weekDiv');
    let monthDayDiv=getMatchingClass(allowDiv,'monthDayDiv');

    if (allowRules.hasOwnProperty('timeRanges')){
        let times =allowRules.timeRanges;
        for (var i =0; i<times.length;i++){
            let rng=times[i];
            let lo=rng[0],hi=rng[1];
            let timeSelector=makeTimeRangeSelector();
            let lohtml=getMatchingClass(timeSelector,'lo');
            let hihtml=getMatchingClass(timeSelector,'hi');
            lohtml.value=lo;
            hihtml.value=hi;
            timeDiv.append(timeSelector);
        }
    }

    if (allowRules.hasOwnProperty('weekDays')){
        let days=allowRules.weekDays;
        for ( i =0; i<days.length;i++){
            let selectDiv = makeWeekDaySelector();
            let selector = getMatchingClass(selectDiv,"selection");
            selector.value=days[i];
            weekDiv.append(selectDiv);
        }
    }

    if (allowRules.hasOwnProperty('monthDays')){
        let days=allowRules.monthDays;
        for (i =0; i<days.length;i++){
            let selectDiv = makeMonthDaySelector();
            let selector = getMatchingClass(selectDiv,"selection");
            selector.value=days[i];
            monthDayDiv.append(selectDiv);
        }
    }
}
function makeAllowDiv(allowRules){
    let allowDiv=blankAllowDiv();
    setAllowDiv(allowDiv,allowRules);
    return allowDiv;
}

function newEmptyRuleForm(){
    let form = makeEl('form');
    let exp_input= makeEl('input');
    exp_input.type='text';
    exp_input.name="exp";
    exp_input['required'] = true;
    let expLabel=makeEl('label');
    expLabel.innerText="Restricted expression:";
    let warnbox=makeEl('input');
    warnbox.type="checkbox";
    warnbox.name='warnOnly';
    let boxLabel=makeEl('label');
    boxLabel.innerText="warn only";
    //boxLabel.setAttribute("for","warn-in"+i);

    let allowDiv=blankAllowDiv();
    let tnode = document.createTextNode("Allow if any of the conditions below are met:");
    allowDiv.insertBefore(tnode,allowDiv.firstChild);
    allowDiv.className='allowDiv';


    form.append(expLabel,exp_input,boxLabel,warnbox,allowDiv);
    return form;
}

function JSONtoForm(json){
    let main_div=$("#main_div")[0];
    main_div.innerHTML='';
    let list=makeEl('ul');
    for (var i =0; i<json.length; i++){
        let rule = json[i];
        let listEl = makeEl('li');
        let form = newEmptyRuleForm();
        form.id=getFormID();
        let exp_input= getMatchingName(form,'exp');
        exp_input.value=rule['exp'];
        let warnbox=getMatchingName(form,'warnOnly');
        if (rule.hasOwnProperty('warnOnly')&&rule.warnOnly){
            warnbox.checked=true;
        }
        let allowDiv=getMatchingClass(form,'allowDiv');
        if (rule.hasOwnProperty('allowIf')){
            setAllowDiv(allowDiv,rule['allowIf']);
        }
        let removeBtn=makeButton("Remove this restriction", ()=>listEl.remove());
        listEl.append(form,removeBtn);
        list.appendChild(listEl);
    }

    let add = makeButton('Add restriction',()=>{
        let form = newEmptyRuleForm();
        let listEl=makeEl('li');
        let removeBtn=makeButton("Remove this restriction", ()=>listEl.remove());
        form.id=getFormID();
        listEl.append(form,removeBtn);
        list.appendChild(listEl);
    });
    let save=makeButton('Save',saveForm), reset=makeButton('Reset to last save',()=>loadStoredForm());
    main_div.append(list,add,save,reset)
}

function saveForm(){
    let form = $('form');
    var rules = [];
    for (var i =0; i<form.length; i++){
        let values = getDescendantInputs(form[i].id);
        var nrule= {};
        var tmp_times={};
        nrule['allowIf']={
            timeRanges:[],
            weekDays:[],
            monthDays:[]
        };
        console.log(values);
        for (var key in values){
            let value = values[key];
            if (key==='exp'||key==='warnOnly'){
                nrule[key]=value;
            }else if(key.includes('allowedWeekDay')){
                nrule.allowIf.weekDays.push(parseInt(value));
            }else if(key.includes('allowedMonthDay')){
                nrule.allowIf.monthDays.push(parseInt(value));
            }else if(key.includes('Time')){
                let timeRanges=nrule.allowIf.timeRanges;
                let idx_s=key.split("_")[1];
                let idx = parseInt(idx_s);
                if (!(idx in tmp_times)){
                    tmp_times[idx]=[0,0];
                }
                let isLo=(key.substring(0,2)==='lo');
                let which_idx=isLo? 0 : 1;
                tmp_times[idx][which_idx]=value;
            }
        }
        for (var t_id in tmp_times){
            nrule['allowIf']['timeRanges'].push(tmp_times[t_id]);
        }

        rules.push(nrule);
    }
    debugger;
    chrome.storage.sync.set({rules:rules},function(result){
        if(chrome.runtime.lastError!==undefined) {
            alert(chrome.runtime.lastError);
        }
    });
}

function loadStoredForm(){
    chrome.storage.sync.get(['rules'],function(result) {
        var form;
        if(chrome.runtime.lastError===undefined){
            form= result['rules'];
            console.log("successful form retrieval:", form);
        }else{
            console.log("form retrieval fail:",chrome.runtime.lastError);
            form= [];
        }
        JSONtoForm(form);
    });
}

loadStoredForm();