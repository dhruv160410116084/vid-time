
let localStream;
let remoteStream;
let users = {}
let remoteUserSocketId;
let peerConnection;
let client = io("wss://stage.thepowerportal.co.uk/vid-time/", { transports: ["websocket"] })
document.getElementById('incoming-call').style.display = 'none'
let PickCallBtn = document.getElementById('pick-call');
let DenyCallBtn = document.getElementById('deny-call')
let CancelCallBtn = document.getElementById('cancel-call')
let CloseRTCallBtn = document.getElementById('close-call')


const servers = {
    iceServers: [
        {
            urls: ['stun:stun1.l.google.com:19302']
        }
    ]
}

let constraints = {
    video: {
        width: { min: 640, ideal: 1920, max: 1920 },
        height: { min: 480, ideal: 1080, max: 1080 },
    },
    audio: true
}

let createPeerConnection = async (MemberId) => {
    peerConnection = new RTCPeerConnection(servers)

    remoteStream = new MediaStream()
    document.getElementById('user-2').srcObject = remoteStream
    document.getElementById('user-2').style.display = 'block'

    document.getElementById('user-1').classList.add('smallFrame')


    if (!localStream) {
        //console.log('navigator ----')
        //console.log(navigator)
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false })
        document.getElementById('user-1').srcObject = localStream
    }

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track, localStream)
    })

    peerConnection.ontrack = (event) => {
        //console.log("on remote track", event)
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = async (event) => {
        //console.log('gen icecandidate', event)
        if (event.candidate) {
            client.emit('candidate', { 'candidate': event.candidate })
        }
    }
    peerConnection.oniceconnectionstatechange = function() {
        //console.log(peerConnection.iceConnectionState)
        if(peerConnection.iceConnectionState == 'disconnected') {
            //console.log('Disconnected');
            CloseRTCConnection()
        }
    }
}

let createOffer = async (MemberId) => {
    //console.log('create offer called')
    await createPeerConnection()

    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    client.emit('offer', { 'offer': offer, member: MemberId })
}

let createAnswer = async (data) => {
    //console.log("offer received", data)
    await createPeerConnection()

    await peerConnection.setRemoteDescription(data.offer)

    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    client.emit('answer', { 'answer': answer, receiver: data.sender })
}

let addAnswer = async (data) => {
    //console.log('ans received', data.answer)
    if (!peerConnection.currentRemoteDescription) {
        peerConnection.setRemoteDescription(data.answer)
    }
    //console.log('connected')
    document.getElementById('controls').style.display=''
    document.getElementById('outgoing-call-controls').style.display = 'none'
    document.getElementById('incoming-call-controls').style.display = 'none'
    document.getElementById('incoming-call').style.display='none'

    client.emit('webrtc-connected',{member:remoteUserSocketId})

}

let leaveChannel = async () => {
    // await channel.leave()
    // await client.logout()
}

client.on('offer', createAnswer)
client.on('answer', addAnswer)
client.on('candidate', (data) => {
    //console.log('candidate', data)

    if (peerConnection) {
        peerConnection.addIceCandidate(data.candidate)
    }
peerConnection.onclose = () => {
        //console.log("datachannel close");
      };
})
client.emit('get-users')
client.on('users', (data) => {
    //console.log('users')
    //console.log(data)
    users = data
    userList()
})

client.on('webtrc-connected',(data)=>{
    //console.log('webrtc-connected',data)
    if(data.member){
        document.getElementById('controls').style.display=''
        document.getElementById('outgoing-call-controls').style.display = 'none'
        document.getElementById('incoming-call-controls').style.display = 'none'
        document.getElementById('incoming-call').style.display='none'
        document.getElementById('outgoing-call').style.display='none'
        document.getElementById('intro').style.display='none'

    }
})

client.on('incoming-call', (id) => {
    document.getElementById('incoming-call-controls').style.display = ''
    //console.log('incoming call from ', id)
    let ac = document.getElementById('incoming-call')
    ac.style.display = ''
    document.getElementById('incoming-call-details').innerText = "Call From " + users[id].name;
    //console.log(ac.style)
    remoteUserSocketId = id;

})

client.on('deny-call',(data)=>{
    //console.log('deny-call added')
    document.getElementById('incoming-call-controls').style.display = 'none'
    document.getElementById('incoming-call').style.display='none'
    document.getElementById('outgoing-call-controls').style.display = 'none'
    document.getElementById('outgoing-call').style.display = 'none'
    document.getElementById('intro').style.display=''

    if(data.self){
        alert('Missed Called From '+ users[data.member].name)

    }else {
        alert('Call denied by '+ users[data.member].name)

    }

})




let init = async (callerId) => {

    // client.on("connect", createOffer);
    createOffer(callerId)
    //console.log(navigator)
    localStream = await navigator.mediaDevices.getUserMedia(constraints)
    document.getElementById('user-1').srcObject = localStream
}


PickCallBtn.onclick = (event) => {
    //console.log(event.target)
    if (remoteUserSocketId) {
        init(remoteUserSocketId);
    }
}

DenyCallBtn.onclick = (event) => {
    //console.log('in deny call')
    document.getElementById('incoming-call').style.display = 'none'
    document.getElementById('incoming-call-controls').style.display = 'none'
    client.emit('deny-call',{member:remoteUserSocketId})
}

CancelCallBtn.onclick = (event) =>{
    //console.log('in cancel call')
    client.emit('deny-call',{member:remoteUserSocketId,self:true})
    document.getElementById('outgoing-call').style.display='none'
    document.getElementById('outgoing-call-controls').style.display = 'none'

}


function CloseRTCConnection(){
    //console.log('close rtc call called')
    document.getElementById('controls').style.display='none'
    //console.log(localStream.getTracks())
    let videoTrack = localStream.getTracks().find(track => track.kind === 'video')
    videoTrack.enabled = false

    let audioTrack = localStream.getTracks().find(track => track.kind === 'audio')
    if(audioTrack){
        audioTrack.enabled = false

    }
   localStream.getTracks().forEach((track) => {
        // peerConnection.addTrack(track, localStream)
        track.stop()
    })
    remoteStream?.getTracks().forEach(track => {
        track.stop()
    })
    peerConnection.close()

    document.getElementById('user-2').style.display='none';
    alert('Call Ended')
    document.getElementById('user-1').style.display='none';
    remoteStream=null;
}
CloseRTCallBtn.onclick = CloseRTCConnection

window.onload = () => {
    //console.log('on load called')
    let person = prompt("Please enter your name");
    if (person) {
        document.getElementById('name').textContent += " " + person
        client.emit('user-data', { name: person })
    }
}
// alert(window.onload)

function call(event) {
    //console.log(event.target.id)
    client.emit('call', event.target.id)
    remoteUserSocketId=event.target.id
    document.getElementById('outgoing-call').style.display=''
    document.getElementById('outgoing-call-details').innerText='Calling '+ users[event.target.id].name
    document.getElementById('outgoing-call-controls').style.display = ''
}

function userList() {
    let UserListElem = document.querySelector('#users-list')
    UserListElem.replaceChildren()
    //console.log(UserListElem, users)
    Object.keys(users).forEach(k => {
        // users[k]
        //console.log('in for loop')
        if (users[k]?.name) {
            let li = document.createElement('li')
            let div = document.createElement('div')
            div.classList.add('user')

            li.appendChild(div)
            UserListElem.appendChild(li)

            let text = document.createElement('div')
            text.innerText = client.id === k ? users[k].name + " (you)" : users[k].name
            div.appendChild(text)

            if(client.id !== k){
                let img = document.createElement('img')
                img.id = k
                img.src = "/assets/icons/conference.png"
                img.onclick = call
                div.appendChild(img)
            }
         

            // img.classList.add('user')

            // div.classList.add('.user')
            //console.log(div)
        }
    })
}

let toggleCamera = async () => {
    let videoTrack = localStream.getTracks().find(track => track.kind === 'video')

    if(videoTrack.enabled){
        videoTrack.enabled = false
        document.getElementById('camera-btn').style.backgroundColor = 'rgb(255, 80, 80)'
    }else{
        videoTrack.enabled = true
        document.getElementById('camera-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
    }
}

let toggleMic = async () => {
    let audioTrack = localStream.getTracks().find(track => track.kind === 'audio')

    if(audioTrack.enabled){
        audioTrack.enabled = false
        document.getElementById('mic-btn').style.backgroundColor = 'rgb(255, 80, 80)'
    }else{
        audioTrack.enabled = true
        document.getElementById('mic-btn').style.backgroundColor = 'rgb(179, 102, 249, .9)'
    }
}

document.getElementById('camera-btn').addEventListener('click', toggleCamera)
document.getElementById('mic-btn').addEventListener('click', toggleMic)
// init()
