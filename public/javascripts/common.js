$("#username").focus();
function login() {
    var username = $("#username").val();
    var password = $('#password').val();
    var is_remember = $('#is_remember').val();
    if (username == "" || username.trim() == "") {
        $(".login-box-msg").text('用户名不能为空');
        new Noty({
            type: 'error',
            layout: 'topCenter',
            text: '用户名不能为空',
            timeout: '2000'
        }).show();
    } else if (password == "" || password.trim() == "") {
        $(".login-box-msg").text('密码不能为空');
        new Noty({
            type: 'error',
            layout: 'topCenter',
            text: '密码不能为空',
            timeout: '2000'
        }).show();
    } else {
        console.log($("#loginForm").serialize())
        $.ajax({
            type: "POST",
            url: "/login",
            data: {username: username, password: password, is_remember: is_remember},
            asyc: false,
            beforeSend:function(){
                $(".login-box-msg").html("<img src='/images/loading.gif'>");
            },
            error: function (error) {
                $(".login-box-msg").text('内部错误，请稍后再试');
                new Noty({
                    type: 'error',
                    layout: 'topCenter',
                    text: '内部错误，请稍后再试',
                    timeout: '2000'
                }).show();
            },
            success: function (result) {
                if (result.error) {
                    $(".login-box-msg").text(result.msg || '登录失败   ');
                    new Noty({
                        type: 'error',
                        layout: 'topCenter',
                        text: result.msg || '登录失败',
                        timeout: '2000'
                    }).show();
                } else {
                    window.location.href = "/";
                }
            }
        });
    }
}
$("#login").click(function () {
    login();
});
$(document).keyup(function(event){
    if(event.keyCode ==13){
        $("#login").trigger("click");
    }
});