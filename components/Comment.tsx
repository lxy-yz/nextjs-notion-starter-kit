// https://giscus.app/
// <script src="https://giscus.app/client.js"
//         data-repo="lxy-yz/chat-prompt-hunt"
//         data-repo-id="R_kgDOJwDyIw"
//         data-category="General"
//         data-category-id="DIC_kwDOJwDyI84CXSpZ"
//         data-mapping="pathname"
//         data-strict="0"
//         data-reactions-enabled="1"
//         data-emit-metadata="0"
//         data-input-position="bottom"
//         data-theme="preferred_color_scheme"
//         data-lang="en"
//         crossorigin="anonymous"
//         async>
// </script>

import * as React from 'react'
import Giscus from '@giscus/react';

export const Comments = () => {
    return (
        <Giscus
            repo="lxy-yz/nextjs-notion-starter-kit"
            repoId="R_kgDOGnZE4w"
            category="General"
            categoryId="DIC_kwDOGnZE484CcI63"
            mapping="pathname"
        />
    );
};