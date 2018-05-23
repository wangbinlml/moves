var datatable = $('#apps').DataTable({
    'bProcessing': true,
    'display': true,
    'paging': true,
    'lengthChange': true,
    'searching': false,
    'info': true,
    'ajax': '/app-manage/load',
    'autoWidth': true,
    "ordering": false,
    "columns": [
        {"data": "name"},
        {"data": "status"},
        {"data": "type"},
        {"data": "created_at"},
        {
            "data": "is",
            render: function (data, type, row, meta) {
                return '<button class="btn" id="id_' + row.id + '" onclick="showSecret(' + row.id + ')">查看安全凭证</button>';
            }
        }
    ],
    "language": {
        "emptyTable": "没有结果可以显示",
        "info": "正在显示第 _START_ 到 _END_ 条数据（共 _TOTAL_ 条）",
        "infoEmpty": "没有数据",
        "infoFiltered": "(已从 _MAX_ 条数据中过滤)",
        "infoPostFix": "",
        "thousands": ",",
        "lengthMenu": "显示 _MENU_ 条",
        "loadingRecords": "加载中...",
        "processing": "处理中...",
        "search": "搜索（任意字段）：",
        "zeroRecords": "没有匹配的数据",
        "paginate": {
            "first": "第一页",
            "last": "最后一页",
            "next": "下一页",
            "previous": "上一页"
        }
    },
    "serverSide": true
});

function showSecret(id) {
    $.ajax({
        type: "get",
        url: "/app-manage/detail",
        asyc: false,
        data: {id: id},
        error: function (error) {
            new Noty({
                type: 'error',
                layout: 'topCenter',
                text: '内部错误，请稍后再试',
                timeout: '5000'
            }).show();
        },
        success: function (result) {
            if (result.error) {
                new Noty({
                    type: 'error',
                    layout: 'topCenter',
                    text: result.msg || '失败',
                    timeout: '2000'
                }).show();
            } else {
                var data = result.data;
                $("#secretShow p span#appid").html("appid: " + data.appid);
                $("#secretShow p span#secret").html("secret: " + data.secret);
                $("#secretShow").show();
                $("#secretShow").dialog({
                    modal: true,
                    title: data.name,
                    buttons: {
                        '确定': function() {
                            $( this ).dialog( "close" );
                            $("#secretShow").hide();
                        }
                    }
                });
            }
        }
    });
}