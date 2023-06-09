export const route = (page, param = "") => {
    if(param == ""){
        window.location.href = page + ".html";
    }
    else{
        window.location.href = page + ".html?" + param;
    }
};

export const setCookie = (cname, cvalue, exdays) => {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires="+d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}

export const getCookie = (cname) => {
    let name = cname + "=";
    let ca = document.cookie.split(';');
    for(let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
        c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
        return c.substring(name.length, c.length);
        }
    }
    return "";
}

export const getFormattedTime = () => {
    // Get Current Timestamp
    var date = new Date();

    // Get hour and minute
    var hour = date.getHours();
	var minute= date.getMinutes();

    var formattedTime = checkTime(hour) + ":" + checkTime(minute);

    return formattedTime;
}

function checkTime(i)
{
	if(i<10)
	{
		i="0"+i;
	}
	
	return i;
}