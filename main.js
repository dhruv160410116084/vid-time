
let localStream;
let remoteStream;

let peerConnection;
let client = io("http://localhost:3000")

const servers = {   
    iceServers:[
        {
            urls:['stun:stun1.l.google.com:19302']
        }
    ]
}

let constraints = {
    video:{
        width:{min:640, ideal:1920, max:1920},
        height:{min:480, ideal:1080, max:1080},
    },
    audio:true
}

let createPeerConnection = async (MemberId) => {
    peerConnection = new RTCPeerConnection(servers)

    remoteStream = new MediaStream()
    document.getElementById('user-2').srcObject = remoteStream
    document.getElementById('user-2').style.display = 'block'

    // document.getElementById('user-1').classList.add('smallFrame')


    if(!localStream){
        localStream = await navigator.mediaDevices.getUserMedia({video:true, audio:false})
        document.getElementById('user-1').srcObject = localStream
    }

    localStream.getTracks().forEach((track) => {
        peerConnection.addTrack(track,localStream)
    })

    peerConnection.ontrack = (event) => {
        console.log("on remote track",event)
        event.streams[0].getTracks().forEach((track) => {
            remoteStream.addTrack(track)
        })
    }

    peerConnection.onicecandidate = async (event) => {
        console.log('gen icecandidate',event)
        if(event.candidate){
            client.emit('candidate', {'candidate':event.candidate})
        }
    }
}

let createOffer = async (MemberId) => {
    console.log('create offer called')
    await createPeerConnection()

    let offer = await peerConnection.createOffer()
    await peerConnection.setLocalDescription(offer)

    client.emit('offer', {'offer':offer})
}

let createAnswer = async (data) => {
    console.log("offer received",data.offer)
    await createPeerConnection()

    await peerConnection.setRemoteDescription(data.offer)

    let answer = await peerConnection.createAnswer()
    await peerConnection.setLocalDescription(answer)

    client.emit('answer', {'answer':answer})
}

let addAnswer = async (data) => {
    console.log('ans received',data.answer)
    if(!peerConnection.currentRemoteDescription){
        peerConnection.setRemoteDescription(data.answer)
    }
}

let leaveChannel = async () => {
    // await channel.leave()
    // await client.logout()
}

client.on('offer',createAnswer)
client.on('answer',addAnswer)
client.on('candidate',(data)=>{
    console.log('candidate',data)

    if(peerConnection){
        peerConnection.addIceCandidate(data.candidate)
    }
})

let init = async () => {

    client.on("connect", createOffer);

    localStream = await navigator.mediaDevices.getUserMedia(constraints)
    document.getElementById('user-1').srcObject = localStream
}

window.onload = ()=>{
    let person = prompt("Please enter your name");
}
// init()
