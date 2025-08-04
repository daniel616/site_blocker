var uniqNum=0;

function fetchUniqNum(){
    return uniqNum++;
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


function getMatchingClass(parent,classname){
    for (var j=0; j<parent.childNodes.length;j++){
        if(parent.childNodes[j].className===classname){
            return parent.childNodes[j];
        }
    }
    assert(false,"no matching class");
}

function _getMatchingName(ancestor,name){
    if(ancestor.name===name){
        return ancestor;
    }else{
        for (var j=0; j<ancestor.childNodes.length;j++){
            let ret= _getMatchingName(ancestor.childNodes[j],name);
            if (ret) return ret;
        }
    }
    return false;
}
function getMatchingName(ancestor,name){
    let ret= _getMatchingName(ancestor,name);
    if (ret) return ret;
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


function assert(condition, message) {
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
}