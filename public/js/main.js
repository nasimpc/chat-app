
const socket = io(window.location.origin);

var currgroupID = 0;
var curruserId;
var groupedit = 0;
socket.on('message', (groupId) => {
    if (currgroupID == groupId) {
        ShowChats();
    }
})



async function myfunction(groupId) {
    currgroupID = groupId
    if (groupId == 0) {
        document.getElementById('curr_group_name').innerHTML = "common";

    }
    else {
        let group = await axios.get(`../group/get-group?groupId=${groupId}`);
        if (group.data.group.AdminId == curruserId) {
            document.getElementById('admin_control').className = "btn btn-info";
        }
        document.getElementById('curr_group_name').innerHTML = group.data.group.name;

    }
    ShowChats();

}

document.getElementById('chat-category').addEventListener('change', () => {
    if (document.getElementById('chat-category').value == "image") {
        document.getElementById('chat').type = "file";
        document.getElementById('chat').setAttribute('accept', 'image/*');
    } else {
        document.getElementById('chat').type = "text";
        document.getElementById('chat').removeAttribute('accept');

    }
});

var token = localStorage.getItem('token');
create_groupBtn.addEventListener('click', showingAllUser);
form_submit.addEventListener('click', createGroup);
admin_control.addEventListener('click', showingGroupDetails);

window.addEventListener("DOMContentLoaded", async () => {
    let res = await axios.get(`../group/get-groups`, { headers: { "Authorization": token } });
    for (var i = 0; i < res.data.groups.length; i++) {
        showGroupOnScreen(res.data.groups[i]);

    }
    const getUserResponse = await axios.get('/user/get-user', { headers: { "Authorization": token } });
    curruserId = getUserResponse.data.userId
});

async function forgetPass(e) {
    e.preventDefault();
    const email = e.target.forgetEmail.value;

    try {
        const data = {
            email: email,
        }

        const res = await axios.post('../password/forgotpassword', data);
        console.log(res);

    }
    catch (err) {
        console.log(err)

    }

}

function showGroupOnScreen(group) {
    var a = document.querySelector('#group_container')
    var groupcard = document.createElement('div');
    groupcard.className = "card"
    //groupcard.onclick = function () { myfunction(group['id']); };
    groupcard.setAttribute("onclick", `myfunction(${group['id']})`);
    groupcard.id = group['id'];
    var groupHeading = document.createElement('h3');
    groupHeading.innerHTML = group['name']
    groupcard.appendChild(groupHeading)

    a.appendChild(groupcard);

}

async function send(e) {
    try {
        e.preventDefault();
        if (document.getElementById('chat-category').value == "text") {
            const chat = event.target.chat.value;
            const obj = { chat: chat }
            await axios.post(`/chat/add-chat`, obj, { headers: { "Authorization": token, "groupID": currgroupID } });
        } else {
            const file = event.target.chat.files[0]
            if (file && file.type.startsWith('image/')) {
                const formData = new FormData();
                formData.append('image', file);
                formData.append('GroupId', currgroupID)
                await axios.post('chat/add-chatImage', formData, { headers: { "Authorization": token, "groupID": currgroupID } })
            } else {
                alert('Please select a valid image file.');
            }
        }
        chat_form.reset();
        socket.emit('new-message', currgroupID);
        ShowChats();
    }
    catch (err) {
        console.log(err);
        alert(err.response.data.message);
    }

}


function showChatOnScreen(chats) {
    var a = document.querySelector('#chat_container')
    a.innerHTML = "";
    chats.forEach((chat) => {
        console.log(chat);
        if (chat.isImage) {
            const date = new Date(chat.date_time);
            const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            const formattedDate = date.toLocaleString('en-US', options);

            var chatdiv = document.createElement('div');
            chatdiv.id = chat['id'];
            chatdiv.innerHTML = `<a href="${chat.message}" target="_blank">
            <img src="${chat.message}" class="chat-image">
          </a>`
            chatdiv.appendChild(document.createTextNode(chat['name'] + ': ' + formattedDate));
            a.appendChild(chatdiv);

        } else {
            const date = new Date(chat.date_time);
            const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
            const formattedDate = date.toLocaleString('en-US', options);

            var chatdiv = document.createElement('div');
            chatdiv.id = chat['id'];
            chatdiv.appendChild(document.createTextNode(chat['name'] + ': ' + chat['message'] + " " + formattedDate));
            a.appendChild(chatdiv);
        }
    })
}


async function ShowChats() {
    try {
        let savingChats
        const chats = localStorage.getItem(`chatHistory${currgroupID}`);
        if (chats && chats.length != 2) {
            const parsedChatHistory = JSON.parse(chats);
            const lastMessageId = parsedChatHistory[parsedChatHistory.length - 1].messageId;
            const APIresponse = await axios.get(`chat/get-messages?lastMessageId=${lastMessageId}`, { headers: { "groupId": currgroupID } });
            const apiChats = APIresponse.data.chats
            const mergedChats = [...parsedChatHistory, ...apiChats];
            savingChats = mergedChats.slice(-100);
        } else {
            const APIresponse = await axios(`chat/get-messages?lastMessageId=0`, { headers: { "groupId": currgroupID } });
            const apiChats = APIresponse.data.chats
            savingChats = apiChats.slice(-100);
        }
        localStorage.setItem(`chatHistory${currgroupID}`, JSON.stringify(savingChats));
        showChatOnScreen(savingChats, curruserId);

    } catch (error) {
        console.log(error);
        alert(error.response.data.message);
        window.location = '/';
    }
}
async function showingAllUser() {
    try {
        user_list.parentElement.classList.remove('d-none');

        const usersResponse = await axios.get('user/get-users', { headers: { "Authorization": token } });
        user_list.innerHTML = "";
        let text = ""
        const { users } = usersResponse.data;
        users.forEach((user) => {
            text += `                                    
        <li class="list-group-item  d-flex  justify-content-between">
            <div class="d-flex  align-items-center justify-content-between">
                <img src="https://picsum.photos/seed/${user.imageUrl}/200" alt="Profile Picture"
                    class="rounded-circle me-3" style="width: 35px; height: 35px;">
                <h6><strong class="mb-1">${user.name}</strong></h6>
            </div>
            <input type="checkbox" class="form-check-inline" name="users" value="${user.id}">
        </li>`
        })
        user_list.innerHTML = text;


    } catch (error) {
        console.log(error);
        alert(error.response.data.message);
    }
}
async function createGroup(e) {
    let group;
    try {

        e.preventDefault();
        const groupName = create_group_form.querySelector('#form_name').value;
        const selectedUsers = Array.from(user_list.querySelectorAll('input[name="users"]:checked'))
            .map(checkbox => checkbox.value);
        const data = {
            name: groupName,
            membersIds: selectedUsers
        }
        if (groupedit == 0) {

            group = await axios.post('group/create-group', data, { headers: { "Authorization": token } });
            alert("Group successfully updated")

        }
        else {
            group = await axios.post(`group/update-group?groupId=${currgroupID}`, data, { headers: { "Authorization": token } });
            form_submit.innerHTML = "Create Group";
            form_heading.innerHTML = `Create new group`;
            groupedit = 0;
            document.getElementById('curr_group_name').innerHTML = group.data.group.name;
            await document.getElementById(`${currgroupID}`).remove();
            alert("Group successfully updated")
        }
        create_group_form.reset();
        $('#group_model').modal('hide');
        showGroupOnScreen(group.data.group);

    } catch (error) {
        console.log(error);
        alert(error.response.data.message);
    }
}
ShowChats();

async function showingGroupDetails(e) {
    try {
        const groupId = currgroupID
        user_list.parentElement.classList.remove('d-none');
        const usersResponse = await axios.get('user/get-users', { headers: { "Authorization": token } });
        const memberApi = await axios(`group/get-group-members?groupId=${groupId}`);
        const groupMebers = memberApi.data.users;
        const idSet = new Set(groupMebers.map(item => item.id));
        user_list.innerHTML = "";
        let text = ""
        const { users } = usersResponse.data;
        users.forEach((user) => {
            if (idSet.has(user.id)) {
                text += `                                    
                <li class="list-group-item  d-flex  justify-content-between">
                    <div class="d-flex  align-items-center justify-content-between">
                        <img src="https://picsum.photos/seed/${user.imageUrl}/200" alt="Profile Picture"
                            class="rounded-circle me-3" style="width: 35px; height: 35px;">
                        <h6><strong class="mb-1">${user.name}</strong></h6>
                    </div>
                    <input type="checkbox" class="form-check-inline" name="users" value="${user.id}" checked>
                </li>`
            } else {
                text += `                                    
                <li class="list-group-item  d-flex  justify-content-between">
                    <div class="d-flex  align-items-center justify-content-between">
                        <img src="https://picsum.photos/seed/${user.imageUrl}/200" alt="Profile Picture"
                            class="rounded-circle me-3" style="width: 35px; height: 35px;">
                        <h6><strong class="mb-1">${user.name}</strong></h6>
                    </div>
                    <input type="checkbox" class="form-check-inline" name="users" value="${user.id}">
                </li>`
            }

        })
        user_list.innerHTML = text;

        const group = await axios(`group/get-group?groupId=${groupId}`);
        document.getElementById('form_name').value = group.data.group.name;
        form_submit.innerHTML = "Update Details";
        form_heading.innerHTML = `Update ${group.data.group.name} Details`;
        //modelElements.editStatus.value = groupId  ///imp
        groupedit = 1;
        //modal_closeBtn.classList.add("d-none")    //imp
    } catch (error) {
        console.log(error);
        alert(error.response.data.message);
    }
}