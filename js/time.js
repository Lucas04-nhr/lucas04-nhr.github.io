var now = new Date();
function createtime(){
    var grt= new Date("03/07/2024 11:57:03");/*---这里是网站的启用时间--*/
    now.setTime(now.getTime()+250);
    days = (now - grt ) / 1000 / 60 / 60 / 24;
    dnum = Math.floor(days);
    hours = (now - grt ) / 1000 / 60 / 60 - (24 * dnum);
    hnum = Math.floor(hours);
    if(String(hnum).length ==1 ){hnum = "0" + hnum;}
    minutes = (now - grt ) / 1000 /60 - (24 * 60 * dnum) - (60 * hnum);
    mnum = Math.floor(minutes);
    if(String(mnum).length ==1 ){mnum = "0" + mnum;}
    seconds = (now - grt ) / 1000 - (24 * 60 * 60 * dnum) - (60 * 60 * hnum) - (60 * mnum);
    snum = Math.round(seconds);
    if(String(snum).length ==1 ){snum = "0" + snum;}
    document.getElementById("timeDate").innerHTML = "This site has been running for "+dnum+" days ";
    document.getElementById("times").innerHTML = hnum + " hour(s) " + mnum + " minute(s) " + snum + "second(s).";
}
setInterval("createtime()",250); 
