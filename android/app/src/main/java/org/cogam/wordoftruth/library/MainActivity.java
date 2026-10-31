package org.cogam.wordoftruth.library;

import android.app.Activity;
import android.os.Bundle;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Color;
import android.net.Uri;
import android.view.Gravity;
import android.view.ViewGroup;
import android.webkit.DownloadListener;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

public final class MainActivity extends Activity {
    private static final String SITE = "https://cogam-digital-library-6kql36.v2.appdeploy.ai/";
    private static final String HOST = "cogam-digital-library-6kql36.v2.appdeploy.ai";
    private static final int DEEP_SLATE = Color.rgb(32, 43, 60);
    private WebView webView;

    @Override
    public void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().setStatusBarColor(DEEP_SLATE);
        getWindow().setNavigationBarColor(DEEP_SLATE);

        LinearLayout layout = new LinearLayout(this);
        layout.setOrientation(LinearLayout.VERTICAL);
        layout.setBackgroundColor(DEEP_SLATE);

        LinearLayout toolbar = new LinearLayout(this);
        toolbar.setPadding(dp(10), dp(5), dp(7), dp(5));
        toolbar.setBackgroundColor(Color.rgb(38, 54, 83));
        toolbar.setGravity(Gravity.CENTER_VERTICAL);

        TextView title = new TextView(this);
        title.setText("COGAM  •  DIGITAL LIBRARY");
        title.setTextSize(13);
        title.setTextColor(Color.WHITE);
        title.setTypeface(null, 1);
        toolbar.addView(title, new LinearLayout.LayoutParams(0, dp(44), 1));

        Button homeButton = new Button(this);
        homeButton.setText("Home");
        homeButton.setTextColor(Color.WHITE);
        homeButton.setBackgroundTintList(
                ColorStateList.valueOf(Color.rgb(91, 88, 224)));
        homeButton.setOnClickListener(v -> {
            if (webView != null) webView.loadUrl(SITE);
        });
        toolbar.addView(homeButton, new LinearLayout.LayoutParams(dp(76), dp(43)));

        Button openBrowser = new Button(this);
        openBrowser.setText("Browser");
        openBrowser.setTextColor(Color.WHITE);
        openBrowser.setBackgroundTintList(
                ColorStateList.valueOf(Color.rgb(232, 111, 90)));
        openBrowser.setContentDescription("Open library in external browser for sign-in");
        openBrowser.setOnClickListener(v -> openExternal(Uri.parse(SITE)));
        toolbar.addView(openBrowser, new LinearLayout.LayoutParams(dp(91), dp(43)));

        layout.addView(toolbar, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, dp(54)));

        webView = new WebView(this);
        webView.setBackgroundColor(DEEP_SLATE);
        webView.getSettings().setJavaScriptEnabled(true);
        webView.getSettings().setDomStorageEnabled(true);
        webView.getSettings().setAllowFileAccess(false);
        webView.getSettings().setAllowContentAccess(false);
        webView.getSettings().setJavaScriptCanOpenWindowsAutomatically(false);
        webView.getSettings().setSupportMultipleWindows(true);
        webView.getSettings().setMediaPlaybackRequiresUserGesture(true);

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri target = request.getUrl();
                if ("https".equals(target.getScheme()) && HOST.equals(target.getHost())) {
                    return false;
                }
                if ("https".equals(target.getScheme()) || "http".equals(target.getScheme())) {
                    openExternal(target);
                }
                return true;
            }
        });
        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog,
                    boolean isUserGesture, android.os.Message resultMsg) {
                WebView popup = new WebView(MainActivity.this);
                popup.setWebViewClient(new WebViewClient() {
                    @Override
                    public boolean shouldOverrideUrlLoading(WebView child, WebResourceRequest req) {
                        openExternal(req.getUrl());
                        child.destroy();
                        return true;
                    }
                });
                WebView.WebViewTransport transport =
                    (WebView.WebViewTransport) resultMsg.obj;
                transport.setWebView(popup);
                resultMsg.sendToTarget();
                return true;
            }
        });
        webView.setDownloadListener((url, agent, disposition, mime, size) -> {
            openExternal(Uri.parse(url));
        });
        layout.addView(webView, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1));
        setContentView(layout);

        if (state == null) {
            webView.loadUrl(SITE);
        } else {
            webView.restoreState(state);
        }
    }

    private int dp(int size) {
        return (int) (size * getResources().getDisplayMetrics().density + 0.5f);
    }

    private void openExternal(Uri uri) {
        try {
            startActivity(new Intent(Intent.ACTION_VIEW, uri));
        } catch (Exception e) {
            Toast.makeText(this, "No browser is available for this link.", Toast.LENGTH_LONG).show();
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        webView.saveState(out);
        super.onSaveInstanceState(out);
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else if (webView != null && !SITE.equals(webView.getUrl())) {
            webView.loadUrl(SITE);
        } else {
            super.onBackPressed();
        }
    }

    @Override
    protected void onDestroy() {
        if (webView != null) webView.destroy();
        super.onDestroy();
    }
}
