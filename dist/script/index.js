const route = (page, param = "") => {
    if(param == ""){
        window.location.href = page + ".html";
    }
    else{
        window.location.href = page + ".html?" + param;
    }
};

const CreateRoomBtn = document.getElementById("create-room-btn");
CreateRoomBtn.addEventListener("click", (e) => {
    route("room", `room=${crypto.randomUUID()}`);
});