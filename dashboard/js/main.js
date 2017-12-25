(function ($) {
  const Tracker = window.Tracker = window.Tracker || {};

  Tracker.init = () => {
    
  };

  Tracker.showRequest = function (req) {
    const $both = $('.detail .both').empty();
    const $req = $('.detail .req').empty();
    const $res = $('.detail .res').empty();

    // append General
    const $general = $('<dl>').addClass('part general');
    $general.append($('<dt>').text('General'));

    $general.append(makeItem('Request Url', req.rawUrl));
    $general.append(makeItem('HTTP Version', `${req.protocol.toUpperCase()}/v${req.httpVersion}`));
    $general.append(makeItem('Request Method', req.method));
    $general.append(makeItem('Status Code', `<em class="statusPoint status_${('' + req.statusCode)[0]}xx"></em>${req.statusCode} ${req.statusMessage}`));
    $general.append(makeItem('Remote Address', req.serverIP));
    $general.append(makeItem('Process Id', req.pid));

    const $copy = $('<a class="copyAsCurl">').text('copy as cURL').on('click', null, req, copyAsCurlHandler);
    const $toast = $('<span class="toast glyphicon glyphicon-ok hide">');
    $copy.append($toast);
    $general.append($copy);

    $both.append($general);

    // append Headers
    [[$req, 'reqHeaders'], [$res, 'resHeaders']].forEach(([ $ele, prop ]) => {
      const prefix = {
        reqHeaders: 'Request',
        resHeaders: 'Response'
      };
      const headers = req[prop];
      if (headers) {
        const $headers = $('<dl>').addClass('part headers');
        $headers.append($('<dt>').text(`${prefix[prop]} Headers`));
  
        Object.keys(headers).forEach((key) => {
          $headers.append(makeItem(key, headers[key]));
        });
        $ele.append($headers);

        // append Cookies
        if (headers.Cookie) {
          // const $cookies = $('<dl>').addClass('part cookies');
          // $cookies.append($('<dt>').text('Cookies'));

          // const cookies = (headers.Cookie || '').split('; ');
          // cookies.forEach((item) => {
          //   const pair = item.split('=');
          //   $cookies.append(makeItem(pair[0], pair[1]));
          // });

          const $cookies = $('<dl>').addClass('part cookies');
          $cookies.append($('<dt>').text('Cookies'));

          const $table = $('<table>').addClass('table table-bordered');

          const $thead = $('<thead>');
          const $tbody = $('<tbody>');

          const $headRow = $('<tr>');
          $headRow.append($('<th>').text('Name'));
          $headRow.append($('<th>').text('Value'));
          $thead.append($headRow);

          const cookies = (headers.Cookie || '').split('; ');
          cookies.forEach((item) => {
            const pair = item.split('=');
            const $row = $('<tr>');
            $row.append($('<td>').text(pair[0]));
            $row.append($('<td>').text(pair[1]));
            $tbody.append($row);
          });

          $table.append($thead);
          $table.append($tbody);
          $cookies.append($table);

          $ele.append($cookies);
        }
      }
    });

    // append Query
    if (req.query) {
      const $query = $('<dl>').addClass('part query');
      $query.append($('<dt>').text('Query'));

      Object.keys(req.query).forEach((key) => {
        $query.append(makeItem(key, decodeURIComponent(req.query[key]) || '&nbsp;'));
      });
      $req.append($query);
    }

    // append Body
    [[$req, 'body'], [$res, 'resBody']].forEach(([ $ele, prop ]) => {
      const prefix = {
        body: 'Request',
        resBody: 'Response'
      };
      let rawBody = req[prop];
      if (rawBody) { 
        const $body = $('<dl>').addClass('part body');
        $body.append($('<dt>').text(`${prefix[prop]} Body`));
        
        let body;
        if (typeof rawBody === 'string') {
          try {
            body = JSON.parse(rawBody);
          } catch (err) {
            /* eslint-disable no-console */
            console.warn(`convert ${prop} failed`, err);
            /* eslint-enable no-console */
          }
        }
  
        const content = body ? JSON.stringify(body, null, 2) : rawBody;
  
        $body.append(makeItem('', $('<pre>').text(content)[0].outerHTML));
        $ele.append($body);
      }
    });
  };

  function makeItem (key, value) {
    const $item = $('<dd>');
    if (key) {
      $item.append($('<strong>').html(`${key}:`));
    }
    $item.append($('<span>').html(value));
    return $item;
  }

  // Copies a string to the clipboard. Must be called from within an 
  // event handler such as click. May return false if it failed, but
  // this is not always possible. Browser support for Chrome 43+, 
  // Firefox 42+, Safari 10+, Edge and IE 10+.
  // IE: The clipboard feature may be disabled by an administrator. By
  // default a prompt is shown the first time the clipboard is 
  // used (per session).
  function copyToClipboard(text) {
    if (window.clipboardData && window.clipboardData.setData) {
      // IE specific code path to prevent textarea being shown while dialog is visible.
      return window.clipboardData.setData("Text", text); 
    } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
      var textarea = document.createElement("textarea");
      textarea.textContent = text;
      textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
      document.body.appendChild(textarea);
      textarea.select();
      try {
        return document.execCommand("copy");  // Security exception may be thrown by some browsers.
      } catch (ex) {
        /* eslint-disable no-console */
        console.warn("Copy to clipboard failed.", ex);
        return false;
      } finally {
        document.body.removeChild(textarea);
      }
    }
  }

  function copyAsCurlHandler({ data: req }) {
    let cmd = `curl -X '${req.method}' '${req.rawUrl}'`;

    // headers
    Object.keys(req.reqHeaders || {}).forEach(key => {
      cmd += ` -H '${`${key}: ${req.reqHeaders[key]}`}'`;
    });

    // body
    let body = req.body;
    if (body) {
      if (typeof body !== 'string') {
        body = JSON.stringify(body);
      }
      cmd += ` --data '${body}'`;
    }
    cmd += ' --compressed';
    copyToClipboard(cmd);

    $(this).children('span.toast').removeClass('hide');
  }

  $('.requests td.req-url').on('click', function (e) {
    e.preventDefault();
    e.stopPropagation();
    const $self = $(this);
    const $tr = $self.parent('tr');
    // change dom states
    $tr.addClass('selected').siblings('tr').removeClass('selected');
    $('.detail-panel').addClass('in');

    const req = $tr.data('req');
    Tracker.showRequest(req);
  });

  $('body').on('click', function (e) {
    if (!($(e.target).hasClass('req-url') || $(e.target).parents('.detail-panel').length)) {
      $('.detail-panel').removeClass('in');
    }
  });

  $('.tab-bar .close').on('click', function () {
    $('.detail-panel').removeClass('in');
  });

  $('.tab-bar .tabs li').on('click', function () {
    const $self = $(this);
    const type = $self.data('type');
    $('.tab-content.req, .tab-content.res').addClass('hide').siblings(`.tab-content.${type}`).removeClass('hide');
    $self.addClass('active').siblings('li').removeClass('active');
  });

  function resizePanel() {
    $('.sider-panel').height(window.innerHeight);
    $('.main').height(window.innerHeight);

    const tabBarHeight = 40;
    $('.detail-panel > .detail').height(window.innerHeight - tabBarHeight);
  }
  window.onresize = resizePanel;
  resizePanel();
})(jQuery);